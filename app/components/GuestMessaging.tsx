'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchMessages()
  }, [eventId])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:public_user_profiles!messages_sender_user_id_fkey(*)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching messages:', error)
        return
      }

      setMessages(data as MessageWithSender[] || [])
    } catch (err) {
      console.error('❌ Unexpected error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

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
        alert('Failed to send message. Please try again.')
        return
      }

      setNewMessage('')
      await fetchMessages()
    } catch (err) {
      console.error('❌ Unexpected error sending message:', err)
      alert('An unexpected error occurred. Please try again.')
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

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢'
      case 'direct': return '💬'
      default: return '💭'
    }
  }

  const getMessageTypeStyle = (type: string, isOwnMessage: boolean) => {
    if (type === 'announcement') {
      return 'bg-blue-50 border-blue-200 text-blue-900'
    }
    
    if (isOwnMessage) {
      return 'bg-purple-500 text-white ml-auto'
    }
    
    return 'bg-gray-100 text-gray-900'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Messages</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-2"></div>
          <span className="text-gray-600">Loading messages...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Messages</h2>

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
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageTypeStyle(message.message_type, isOwnMessage)}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center mb-1">
                      <span className="text-xs mr-1">{getMessageTypeIcon(message.message_type)}</span>
                      <span className="text-xs font-medium">
                        {message.sender?.full_name || 'Unknown User'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-200' : 'text-gray-500'}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💭</div>
            <p className="text-gray-600">No messages yet</p>
            <p className="text-gray-500 text-sm">Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Send a message to everyone..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          disabled={sending || !currentUserId}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending || !currentUserId}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            '📤'
          )}
        </button>
      </div>
    </div>
  )
} 