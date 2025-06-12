import { getErrorMessage } from './utils'

// Twilio configuration - will be dynamically imported to avoid server-side issues
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

// Initialize Twilio client lazily
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let twilioClient: any = null

const getTwilioClient = async () => {
  if (!twilioClient && accountSid && authToken) {
    const twilio = (await import('twilio')).default
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

export interface SMSMessage {
  to: string
  message: string
  eventId: string
  guestId?: string
  messageType?: 'rsvp_reminder' | 'announcement' | 'welcome' | 'custom'
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  status?: string
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS({ 
  to, 
  message, 
  eventId, 
  guestId, 
  messageType = 'custom' 
}: SMSMessage): Promise<SMSResult> {
  try {
    // Get Twilio client
    const client = await getTwilioClient()
    if (!client || (!twilioPhoneNumber && !twilioMessagingServiceSid)) {
      throw new Error('Twilio not configured. Please check your environment variables.')
    }

    // Validate phone number format
    const formattedPhone = formatPhoneNumber(to)
    if (!formattedPhone) {
      throw new Error('Invalid phone number format')
    }

    console.log(`📱 Sending SMS to ${formattedPhone}:`, message.substring(0, 50) + '...')

    // Create message params - use messaging service if available, otherwise phone number
    const messageParams: {
      body: string
      to: string
      messagingServiceSid?: string
      from?: string
    } = {
      body: message,
      to: formattedPhone,
    }

    if (twilioMessagingServiceSid) {
      messageParams.messagingServiceSid = twilioMessagingServiceSid
      console.log(`📱 Using Messaging Service: ${twilioMessagingServiceSid}`)
    } else if (twilioPhoneNumber) {
      messageParams.from = twilioPhoneNumber
      console.log(`📱 Using Phone Number: ${twilioPhoneNumber}`)
    } else {
      throw new Error('No Twilio sender configured')
    }

    // Send SMS via Twilio
    const twilioMessage = await client.messages.create(messageParams)

    console.log(`✅ SMS sent successfully. SID: ${twilioMessage.sid}`)

    // Log to database for tracking
    await logSMSToDatabase({
      eventId,
      guestId,
      phoneNumber: formattedPhone,
      content: message,
      messageType,
      twilioSid: twilioMessage.sid,
      status: 'sent'
    })

    return {
      success: true,
      messageId: twilioMessage.sid,
      status: twilioMessage.status
    }

  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.error('❌ Failed to send SMS:', errorMessage)

    // Log failed message to database
    if (eventId) {
      await logSMSToDatabase({
        eventId,
        guestId,
        phoneNumber: to,
        content: message,
        messageType,
        status: 'failed',
        errorMessage
      })
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Send bulk SMS messages (for announcements)
 */
export async function sendBulkSMS(
  messages: SMSMessage[]
): Promise<{ sent: number; failed: number; results: SMSResult[] }> {
  const results: SMSResult[] = []
  let sent = 0
  let failed = 0

  console.log(`📱 Sending bulk SMS to ${messages.length} recipients`)

  // Send messages with a small delay to avoid rate limiting
  for (const message of messages) {
    const result = await sendSMS(message)
    results.push(result)
    
    if (result.success) {
      sent++
    } else {
      failed++
    }

    // Small delay to be respectful to Twilio's rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`✅ Bulk SMS complete: ${sent} sent, ${failed} failed`)

  return { sent, failed, results }
}

/**
 * Send RSVP reminder to specific guests
 */
export async function sendRSVPReminder(
  eventId: string,
  guestIds?: string[]
): Promise<{ sent: number; failed: number }> {
  try {
    // Import Supabase dynamically to avoid circular dependencies
    const { supabase } = await import('./supabase')
    
    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, event_date, host:public_user_profiles!events_host_user_id_fkey(full_name)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    // Fetch guests who need reminders
    let query = supabase
      .from('event_guests')
      .select('id, guest_name, phone, rsvp_status')
      .eq('event_id', eventId)
      .not('phone', 'is', null)
      .not('sms_opt_out', 'eq', true)

    if (guestIds && guestIds.length > 0) {
      query = query.in('id', guestIds)
    } else {
      // Only send to pending RSVPs
      query = query.or('rsvp_status.is.null,rsvp_status.eq.Pending')
    }

    const { data: guests, error: guestsError } = await query

    if (guestsError) {
      throw new Error('Failed to fetch guests')
    }

    if (!guests || guests.length === 0) {
      return { sent: 0, failed: 0 }
    }

    // Create reminder message
    const hostName = (event.host as { full_name?: string })?.full_name || 'Your host'
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })

    const messages: SMSMessage[] = guests
      .filter(guest => guest.phone)
      .map(guest => ({
        to: guest.phone!,
        message: createRSVPReminderMessage(guest.guest_name, event.title, eventDate, hostName),
        eventId,
        guestId: guest.id,
        messageType: 'rsvp_reminder' as const
      }))

    const result = await sendBulkSMS(messages)
    return { sent: result.sent, failed: result.failed }

  } catch (error) {
    console.error('❌ Failed to send RSVP reminders:', error)
    return { sent: 0, failed: 1 }
  }
}

/**
 * Send announcement to all guests
 */
export async function sendEventAnnouncement(
  eventId: string,
  announcement: string,
  targetGuestIds?: string[]
): Promise<{ sent: number; failed: number }> {
  try {
    // Import Supabase dynamically to avoid circular dependencies
    const { supabase } = await import('./supabase')
    
    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, host:public_user_profiles!events_host_user_id_fkey(full_name)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    // Fetch guests with phone numbers
    let query = supabase
      .from('event_guests')
      .select('id, guest_name, phone')
      .eq('event_id', eventId)
      .not('phone', 'is', null)
      .not('sms_opt_out', 'eq', true)

    if (targetGuestIds && targetGuestIds.length > 0) {
      query = query.in('id', targetGuestIds)
    }

    const { data: guests, error: guestsError } = await query

    if (guestsError) {
      throw new Error('Failed to fetch guests')
    }

    if (!guests || guests.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const hostName = (event.host as { full_name?: string })?.full_name || 'Your host'
    
    const messages: SMSMessage[] = guests
      .filter(guest => guest.phone)
      .map(guest => ({
        to: guest.phone!,
        message: createAnnouncementMessage(guest.guest_name, announcement, event.title, hostName),
        eventId,
        guestId: guest.id,
        messageType: 'announcement' as const
      }))

    const result = await sendBulkSMS(messages)
    return { sent: result.sent, failed: result.failed }

  } catch (error) {
    console.error('❌ Failed to send announcement:', error)
    return { sent: 0, failed: 1 }
  }
}

/**
 * Format phone number for Twilio (E.164 format)
 */
function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If it already has country code
  if (digits.length > 10 && !digits.startsWith('1')) {
    return `+${digits}`
  }
  
  return null
}

/**
 * Create personalized RSVP reminder message
 */
function createRSVPReminderMessage(
  guestName: string | null,
  eventTitle: string,
  eventDate: string,
  hostName: string
): string {
  const name = guestName || 'there'
  
  return `Hi ${name}! ${hostName} here. We're excited for ${eventTitle} on ${eventDate} and would love to know if you can join us! Please RSVP when you have a moment. Can't wait to celebrate! 💕

Reply STOP to opt out.`
}

/**
 * Create personalized announcement message
 */
function createAnnouncementMessage(
  guestName: string | null,
  announcement: string,
  eventTitle: string,
  hostName: string
): string {
  const name = guestName || 'there'
  
  return `Hi ${name}! ${hostName} here with an update about ${eventTitle}:

${announcement}

Reply STOP to opt out.`
}

/**
 * Log SMS to database for tracking
 */
async function logSMSToDatabase({
  guestId,
  phoneNumber,
  twilioSid,
  status
}: {
  eventId: string
  guestId?: string
  phoneNumber: string
  content: string
  messageType: string
  twilioSid?: string
  status: string
  errorMessage?: string
}) {
  try {
    // Only log if we have a guest_id (required field)
    if (!guestId) {
      return
    }

    const { supabase } = await import('./supabase')
    
    const { error } = await supabase
      .from('message_deliveries')
      .insert({
        guest_id: guestId,
        phone_number: phoneNumber,
        sms_status: status,
        sms_provider_id: twilioSid
      })

    if (error) {
      console.error('Failed to log SMS to database:', error)
    }
  } catch (dbError: unknown) {
    console.error('Database logging error:', getErrorMessage(dbError))
  }
} 