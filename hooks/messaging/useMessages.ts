import { useEffect, useState, useCallback } from 'react'
import { 
  supabase,
  getEventMessages, 
  createMessage, 
  subscribeToEventMessages,
  type MessageInsert,
  type MessageWithSender 
} from '@/lib/supabase'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseMessagesReturn {
  messages: MessageWithSender[]
  loading: boolean
  error: AppError | null
  sendMessage: (messageData: MessageInsert) => Promise<{ success: boolean; error: string | null }>
  refetch: () => Promise<void>
}

export function useMessages(eventId: string | null): UseMessagesReturn {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!eventId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First check if user has permission to access this event
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('⚠️ No authenticated user for messages')
        setMessages([])
        setLoading(false)
        return
      }

      // Fetch messages without join to avoid RLS issues
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        // If it's a permission error, just log it and return empty array
        if (messagesError.code === 'PGRST301' || messagesError.message?.includes('permission')) {
          console.warn('⚠️ No permission to access messages for this event')
          setMessages([])
          setLoading(false)
          return
        }
        console.error('❌ Messages fetch error:', messagesError)
        throw new Error(messagesError.message || 'Failed to fetch messages')
      }

      // Fetch sender profiles separately to handle RLS gracefully
      const uniqueSenderIds = Array.from(new Set(
        messagesData?.map(m => m.sender_user_id).filter(Boolean) || []
      ))

      const sendersMap = new Map<string, any>()

      for (const senderId of uniqueSenderIds) {
        try {
          const { data: senderData, error: senderError } = await supabase
            .from('public_user_profiles')
            .select('*')
            .eq('id', senderId)
            .single()

          if (!senderError && senderData) {
            sendersMap.set(senderId, senderData)
          }
        } catch (err) {
          // Silently handle individual sender fetch failures
        }
      }

      // Combine messages with sender info
      const messagesWithSenders: MessageWithSender[] = (messagesData || []).map(message => ({
        ...message,
        sender: message.sender_user_id ? sendersMap.get(message.sender_user_id) || null : null
      }))

      setMessages(messagesWithSenders)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages'
      console.warn('⚠️ useMessages fetchMessages error:', err)
      // Don't set error state for permission issues, just return empty array
      setMessages([])
      setLoading(false)
    }
  }, [eventId])

  const sendMessage = useCallback(async (messageData: MessageInsert) => {
    const wrappedSend = withErrorHandling(async () => {
      const { data, error } = await createMessage(messageData)

      if (error) {
        throw new Error('Failed to send message')
      }

      return { success: true, error: null }
    }, 'useMessages.sendMessage')

    const result = await wrappedSend()
    if (result?.error) {
      logError(result.error, 'useMessages.sendMessage')
      return { success: false, error: result.error.message }
    }
    return { success: true, error: null }
  }, [])

  const refetch = useCallback(async () => {
    await fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return

    const subscription = subscribeToEventMessages(eventId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Refetch to get the new message with sender info
        fetchMessages()
      } else if (payload.eventType === 'DELETE') {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      } else if (payload.eventType === 'UPDATE') {
        // Refetch to get updated message data
        fetchMessages()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId, fetchMessages])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch,
  }
} 