import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendBulkSMS } from '@/lib/sms'
import type { Database } from '@/app/reference/supabase.types'

type ScheduledMessage = Database['public']['Tables']['scheduled_messages']['Row']
type Guest = Database['public']['Tables']['event_guests']['Row']

export async function POST() {
  try {
    // This route processes scheduled messages that are ready to be sent
    console.log('🔄 Processing scheduled messages...')

    // Get messages that are ready to be sent
    const now = new Date().toISOString()
    const { data: messages, error: messagesError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('send_at', now)
      .limit(50) // Process in batches

    if (messagesError) {
      throw new Error(`Failed to fetch scheduled messages: ${messagesError.message}`)
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No messages to process',
        processed: 0 
      })
    }

    console.log(`📋 Found ${messages.length} messages to process`)

    let totalProcessed = 0
    let totalSent = 0
    let totalFailed = 0

    // Process each message
    for (const message of messages) {
      try {
        // Mark message as sending
        await supabase
          .from('scheduled_messages')
          .update({ status: 'sending' })
          .eq('id', message.id)

        // Get target guests for this message
        const targetGuests = await getTargetGuests(message)
        
        if (targetGuests.length === 0) {
          console.log(`⚠️ No target guests found for message ${message.id}`)
          await supabase
            .from('scheduled_messages')
            .update({ 
              status: 'failed',
              failure_count: 0,
              recipient_count: 0
            })
            .eq('id', message.id)
          continue
        }

        // Create message deliveries records
        const deliveryRecords = targetGuests.map(guest => ({
          scheduled_message_id: message.id,
          guest_id: guest.id,
          phone_number: guest.phone,
          email: guest.guest_email,
          user_id: guest.user_id,
          sms_status: message.send_via_sms ? 'pending' : 'not_applicable',
          push_status: message.send_via_push ? 'pending' : 'not_applicable',
          email_status: message.send_via_email ? 'pending' : 'not_applicable'
        }))

        const { error: deliveryError } = await supabase
          .from('message_deliveries')
          .insert(deliveryRecords)

        if (deliveryError) {
          console.error('Failed to create delivery records:', deliveryError)
        }

        // Send SMS messages if enabled
        if (message.send_via_sms) {
          const smsMessages = targetGuests
            .filter(guest => guest.phone && !guest.sms_opt_out)
            .map(guest => ({
              to: guest.phone!,
              message: formatMessageForGuest(message.content, guest),
              eventId: message.event_id,
              guestId: guest.id,
              messageType: 'custom' as const
            }))

          if (smsMessages.length > 0) {
            console.log(`📱 Sending ${smsMessages.length} SMS messages for message ${message.id}`)
            const smsResult = await sendBulkSMS(smsMessages)
            totalSent += smsResult.sent
            totalFailed += smsResult.failed

            // Update delivery records with SMS provider IDs
            for (let i = 0; i < smsResult.results.length; i++) {
              const result = smsResult.results[i]
              const smsMessage = smsMessages[i]
              
              if (result.success && result.messageId) {
                await supabase
                  .from('message_deliveries')
                  .update({ 
                    sms_provider_id: result.messageId,
                    sms_status: 'sent'
                  })
                  .eq('scheduled_message_id', message.id)
                  .eq('guest_id', smsMessage.guestId)
              }
            }
          }
        }

        // Update scheduled message status
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            recipient_count: targetGuests.length,
            success_count: totalSent,
            failure_count: totalFailed
          })
          .eq('id', message.id)

        totalProcessed++
        console.log(`✅ Processed message ${message.id}: ${targetGuests.length} recipients`)

      } catch (messageError) {
        console.error(`❌ Failed to process message ${message.id}:`, messageError)
        
        // Mark message as failed
        await supabase
          .from('scheduled_messages')
          .update({ 
            status: 'failed',
            failure_count: (message.failure_count || 0) + 1
          })
          .eq('id', message.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} messages`,
      processed: totalProcessed,
      sent: totalSent,
      failed: totalFailed
    })

  } catch (error) {
    console.error('❌ Error processing scheduled messages:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled messages' },
      { status: 500 }
    )
  }
}

// Helper function to get target guests based on message targeting
async function getTargetGuests(message: ScheduledMessage): Promise<Guest[]> {
  let query = supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', message.event_id)

  // If targeting all guests, return all
  if (message.target_all_guests) {
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // Otherwise, apply specific targeting
  // Target specific guest IDs
  if (message.target_guest_ids && message.target_guest_ids.length > 0) {
    query = query.in('id', message.target_guest_ids)
  }

  // Target guests with specific tags
  if (message.target_guest_tags && message.target_guest_tags.length > 0) {
    // This requires a more complex query for array intersection
    query = query.overlaps('guest_tags', message.target_guest_tags)
  }

  // Target guests assigned to specific sub-events
  if (message.target_sub_event_ids && message.target_sub_event_ids.length > 0) {
    // Get guest IDs from sub-event assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('guest_sub_event_assignments')
      .select('guest_id')
      .in('sub_event_id', message.target_sub_event_ids)
      .eq('is_invited', true)

    if (assignmentError) throw assignmentError

    const assignedGuestIds = assignments?.map(a => a.guest_id) || []
    
    if (assignedGuestIds.length > 0) {
      query = query.in('id', assignedGuestIds)
    } else {
      // No guests found for these sub-events
      return []
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Helper function to personalize message content
function formatMessageForGuest(content: string, guest: Guest): string {
  const guestName = guest.guest_name || 'there'
  
  // Simple personalization - can be enhanced
  return content
    .replace(/\{name\}/gi, guestName)
    .replace(/\{first_name\}/gi, guestName.split(' ')[0] || guestName)
}

// Manual trigger endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to process scheduled messages',
    endpoint: '/api/messages/process-scheduled'
  })
} 