import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    // Parse webhook data from Twilio
    const formData = await request.formData()
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const to = formData.get('To') as string
    const errorCode = formData.get('ErrorCode') as string
    const errorMessage = formData.get('ErrorMessage') as string

    console.log('📱 Twilio webhook received:', {
      messageSid,
      messageStatus,
      to,
      errorCode,
      errorMessage
    })

    // Update message delivery status in database
    if (messageSid) {
      const { error } = await supabase
        .from('message_deliveries')
        .update({
          sms_status: messageStatus,
          error_code: errorCode || null,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('sms_provider_id', messageSid)

      if (error) {
        console.error('Failed to update message delivery status:', error)
      } else {
        console.log(`✅ Updated delivery status for ${messageSid}: ${messageStatus}`)
      }
    }

    // Respond with success (Twilio expects 200)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error processing Twilio webhook:', error)
    
    // Still return 200 to Twilio to avoid retries
    return NextResponse.json({ success: false }, { status: 200 })
  }
} 