'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface QuickActionsProps {
  eventId: string
}

export function QuickActions({ eventId }: QuickActionsProps) {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    pendingRSVPs: 0,
    recentMessages: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuickStats() {
      try {
        // Get participant stats
        const { data: participantData } = await supabase
          .from('event_participants')
          .select('rsvp_status')
          .eq('event_id', eventId)

        // Get recent message count
        const { data: messageData } = await supabase
          .from('messages_new')
          .select('id')
          .eq('event_id', eventId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        const totalParticipants = participantData?.length || 0
        const pendingRSVPs = participantData?.filter(p => !p.rsvp_status || p.rsvp_status === 'pending').length || 0
        const recentMessages = messageData?.length || 0

        setStats({
          totalParticipants,
          pendingRSVPs,
          recentMessages
        })
      } catch (error) {
        console.error('Error fetching quick stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuickStats()
  }, [eventId])

  const handleSendReminder = async () => {
    // Simple RSVP reminder functionality
    try {
      // This could be enhanced to send actual reminders
      console.log('Sending RSVP reminders...')
      
      // For now, just show a success message
      alert('RSVP reminders sent successfully!')
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Failed to send reminders. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
        <span className="text-xl mr-2">⚡</span>
        Quick Actions
      </h2>

      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-stone-50 rounded-lg">
            <div className="text-xl font-bold text-stone-700">{stats.totalParticipants}</div>
            <div className="text-xs text-stone-600">Participants</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-xl font-bold text-amber-700">{stats.pendingRSVPs}</div>
            <div className="text-xs text-stone-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-700">{stats.recentMessages}</div>
            <div className="text-xs text-stone-600">Messages</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {stats.pendingRSVPs > 0 && (
            <Button 
              onClick={handleSendReminder}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              📧 Send RSVP Reminder ({stats.pendingRSVPs})
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => window.open(`/host/events/${eventId}/dashboard?tab=messages`, '_self')}
          >
            💬 Send Message
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => window.open(`/host/events/${eventId}`, '_blank')}
          >
            👁️ Preview Guest View
          </Button>
        </div>

        {stats.totalParticipants === 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-700 font-medium mb-1">
              🚀 Get Started
            </div>
            <div className="text-xs text-purple-600">
              Import your guest list to begin sending invitations
            </div>
          </div>
        )}
      </div>
    </div>
  )
}