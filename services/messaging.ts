import { supabase } from '@/lib/supabase/client'

// Messaging service functions
export const getEventMessages = async (eventId: string) => {
  return await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
}

export const sendMessage = async (messageData: {
  event_id: string
  sender_user_id: string
  content: string
  message_type?: 'text' | 'announcement' | 'system'
}) => {
  return await supabase
    .from('messages')
    .insert({
      event_id: messageData.event_id,
      sender_user_id: messageData.sender_user_id,
      content: messageData.content,
      message_type: messageData.message_type || 'text'
    })
    .select(`
      *,
      sender:users!messages_sender_user_id_fkey(*)
    `)
    .single()
}

export const deleteMessage = async (id: string) => {
  return await supabase
    .from('messages')
    .delete()
    .eq('id', id)
}

// Note: Message reads and scheduled messages are not implemented in the current schema
// These can be added later if needed

export const markMessageAsRead = async (messageId: string, userId: string) => {
  // Implementation placeholder - would need message_reads table
  console.log('markMessageAsRead not implemented - missing message_reads table')
  return { data: null, error: null }
}

export const getUnreadMessageCount = async (eventId: string, userId: string) => {
  // Implementation placeholder - would need message_reads table
  console.log('getUnreadMessageCount not implemented - missing message_reads table')
  return 0
}

export const scheduleMessage = async (messageData: {
  event_id: string
  sender_user_id: string
  content: string
  scheduled_for: string
  message_type?: 'text' | 'announcement' | 'system'
}) => {
  // Implementation placeholder - would need scheduled_messages table
  console.log('scheduleMessage not implemented - missing scheduled_messages table')
  return { data: null, error: { message: 'Scheduled messages not implemented' } }
}

export const getScheduledMessages = async (eventId: string) => {
  // Implementation placeholder - would need scheduled_messages table
  console.log('getScheduledMessages not implemented - missing scheduled_messages table')
  return { data: [], error: null }
}

export const processScheduledMessages = async () => {
  // Implementation placeholder - would need scheduled_messages table
  console.log('processScheduledMessages not implemented - missing scheduled_messages table')
  return []
} 