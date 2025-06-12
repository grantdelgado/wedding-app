'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/app/reference/supabase.types'

type Message = Database['public']['Tables']['messages']['Row']
type PublicUserProfile = Database['public']['Views']['public_user_profiles']['Row']

interface MessageWithSender extends Message {
  sender: PublicUserProfile | null
}

interface GuestMessagingProps {
  eventId: string
  currentUserId: string | null
}

export default function GuestMessaging({ eventId, currentUserId }: GuestMessagingProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      // First, try to fetch messages without the join to avoid RLS issues
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError)
        setMessages([])
        setLoading(false)
        return
      }

      // Then try to fetch sender info for each unique sender
      const uniqueSenderIds = Array.from(new Set(
        messagesData?.map(m => m.sender_user_id).filter((id): id is string => Boolean(id)) || []
      ))

      const sendersMap = new Map<string, PublicUserProfile>()

      // Fetch sender profiles separately to handle RLS gracefully
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
        } catch {
          // Silently handle individual sender fetch failures
        }
      }

      // Combine messages with sender info
      const messagesWithSenders: MessageWithSender[] = (messagesData || []).map(message => ({
        ...message,
        sender: message.sender_user_id ? sendersMap.get(message.sender_user_id) || null : null
      }))

      setMessages(messagesWithSenders)
    } catch (err) {
      console.error('❌ Unexpected error fetching messages:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          sender_user_id: currentUserId,
          content: newMessage.trim(),
          message_type: 'channel'
        })

      if (error) {
        console.error('❌ Error sending message:', error)
        alert('Something went wrong. Please try again.')
        return
      }

      setNewMessage('')
      await fetchMessages()
    } catch (err) {
      console.error('❌ Unexpected error sending message:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getMessageTypeStyle = (type: string, isOwnMessage: boolean) => {
    if (type === 'announcement') {
      return 'bg-purple-50 border border-purple-200 text-purple-900'
    }
    
    if (isOwnMessage) {
      return 'bg-stone-800 text-white ml-auto'
    }
    
    return 'bg-stone-100 text-stone-900'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-medium text-stone-800 mb-4">Broadcasts</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mr-3"></div>
          <span className="text-stone-600">Loading broadcasts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-xl font-medium text-stone-800 mb-4">Broadcasts</h2>

      {/* Messages List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isOwnMessage = message.sender_user_id === currentUserId
            const isAnnouncement = message.message_type === 'announcement'
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage && !isAnnouncement ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${getMessageTypeStyle(message.message_type, isOwnMessage)}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-stone-600">
                        {message.sender?.full_name || 'Someone'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${isOwnMessage ? 'text-stone-300' : 'text-stone-500'}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-stone-600 mb-1">No broadcasts yet—but they&apos;ll arrive soon.</p>
            <p className="text-stone-500 text-sm">Hosts will share updates here.</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex space-x-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Share a message with everyone..."
          className="flex-1 px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
          disabled={sending || !currentUserId}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending || !currentUserId}
          className="px-4 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  )
} 