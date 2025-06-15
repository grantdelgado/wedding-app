'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGuests } from '@/hooks/guests'
import { useEventMedia } from '@/hooks/media'
import { useMessages } from '@/hooks/messaging'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type SubEvent = Database['public']['Tables']['sub_events']['Row']

interface EventAnalyticsProps {
  eventId: string
}



interface RSVPStats {
  attending: number
  declined: number
  maybe: number
  pending: number
  total: number
  responseRate: number
}

export function EventAnalytics({ eventId }: EventAnalyticsProps) {
  // Use our refactored hooks
  const { guests, loading: guestsLoading, error: guestsError } = useGuests(eventId)
  const { media, loading: mediaLoading, error: mediaError } = useEventMedia(eventId)
  const { messages, loading: messagesLoading, error: messagesError } = useMessages(eventId)
  
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Combine loading states
  const isLoading = guestsLoading || mediaLoading || messagesLoading || loading
  const hasError = guestsError || mediaError || messagesError || error

  useEffect(() => {
    async function fetchSubEvents() {
      try {
        setLoading(true)
        setError(null)

        // Only fetch sub-events since other data comes from hooks
        const { data: subEventsData, error: subEventsError } = await supabase
          .from('sub_events')
          .select('*')
          .eq('event_id', eventId)
          .order('sort_order')

        if (subEventsError) throw subEventsError

        setSubEvents(subEventsData || [])
      } catch (err) {
        console.error('Error fetching sub-events:', err)
        setError('Failed to load sub-events data')
      } finally {
        setLoading(false)
      }
    }

    fetchSubEvents()
  }, [eventId])

  const rsvpStats = useMemo((): RSVPStats => {
    if (!guests) {
      return { attending: 0, declined: 0, maybe: 0, pending: 0, total: 0, responseRate: 0 }
    }

    const stats = guests.reduce(
      (acc, guest) => {
        const status = guest.rsvp_status?.toLowerCase() || 'pending'
        if (status === 'attending') acc.attending++
        else if (status === 'declined') acc.declined++
        else if (status === 'maybe') acc.maybe++
        else acc.pending++
        acc.total++
        return acc
      },
      { attending: 0, declined: 0, maybe: 0, pending: 0, total: 0, responseRate: 0 }
    )

    stats.responseRate = stats.total > 0 
      ? Math.round(((stats.attending + stats.declined + stats.maybe) / stats.total) * 100)
      : 0

    return stats
  }, [guests])

  const engagementStats = useMemo(() => {
    if (!media || !messages) return { totalUploads: 0, totalMessages: 0, activeGuests: 0 }

    // Calculate unique guests who have engaged (uploaded media or sent messages)
    const uploaderIds = new Set(media.map(m => m.uploader_user_id).filter(Boolean))
    const senderIds = new Set(messages.map(m => m.sender_user_id).filter(Boolean))
    const activeGuests = new Set([...uploaderIds, ...senderIds]).size

    return {
      totalUploads: media.length,
      totalMessages: messages.length,
      activeGuests
    }
  }, [media, messages])

  const recentActivity = useMemo(() => {
    if (!media || !messages) return []

    const activities = [
      ...media.map(m => ({
        id: m.id,
        type: 'upload' as const,
        timestamp: m.created_at,
        description: 'New photo uploaded'
      })),
      ...messages.map(m => ({
        id: m.id,
        type: 'message' as const,
        timestamp: m.created_at,
        description: m.message_type === 'announcement' ? 'Host announcement' : 'Guest message'
      }))
    ]

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }, [media, messages])

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-stone-600">
            {typeof hasError === 'string' ? hasError : hasError?.message || 'Failed to load analytics data'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* RSVP Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stone-800 flex items-center">
            <span className="text-2xl mr-2">📊</span>
            RSVP Analytics
          </h2>
          <div className="text-sm text-stone-500">
            {rsvpStats.responseRate}% response rate
          </div>
        </div>

        {/* RSVP Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{rsvpStats.attending}</div>
            <div className="text-sm text-emerald-600">Attending</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{rsvpStats.maybe}</div>
            <div className="text-sm text-amber-600">Maybe</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{rsvpStats.declined}</div>
            <div className="text-sm text-red-600">Declined</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-stone-700">{rsvpStats.pending}</div>
            <div className="text-sm text-stone-600">Pending</div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-stone-600">
            <span>Response Progress</span>
            <span>{rsvpStats.total - rsvpStats.pending} of {rsvpStats.total} responded</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-emerald-500" 
                style={{ width: `${(rsvpStats.attending / rsvpStats.total) * 100}%` }}
              />
              <div 
                className="bg-amber-500" 
                style={{ width: `${(rsvpStats.maybe / rsvpStats.total) * 100}%` }}
              />
              <div 
                className="bg-red-500" 
                style={{ width: `${(rsvpStats.declined / rsvpStats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
          <span className="text-2xl mr-2">🎯</span>
          Guest Engagement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{engagementStats.totalUploads}</div>
            <div className="text-sm text-stone-600">Photos Shared</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600">{engagementStats.totalMessages}</div>
            <div className="text-sm text-stone-600">Messages Sent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-600">{engagementStats.activeGuests}</div>
            <div className="text-sm text-stone-600">Active Guests</div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-stone-800">
                {rsvpStats.total > 0 ? Math.round((engagementStats.activeGuests / rsvpStats.total) * 100) : 0}% Engagement Rate
              </div>
              <div className="text-sm text-stone-600">
                {engagementStats.activeGuests} of {rsvpStats.total} guests have shared or messaged
              </div>
            </div>
            <div className="text-3xl">💝</div>
          </div>
        </div>
      </div>

      {/* Sub-Events Overview */}
      {subEvents && subEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
            <span className="text-2xl mr-2">🗓️</span>
            Event Schedule
          </h2>
          
          <div className="space-y-3">
            {subEvents.map((subEvent) => (
              <div key={subEvent.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                <div>
                  <div className="font-medium text-stone-800">{subEvent.name}</div>
                  {subEvent.event_date && (
                    <div className="text-sm text-stone-500">
                      {new Date(subEvent.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  {subEvent.location && (
                    <div className="text-sm text-stone-500">{subEvent.location}</div>
                  )}
                </div>
                <div className="text-sm text-stone-600">
                  {subEvent.is_required ? '✅ Required' : '📝 Optional'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
          <span className="text-2xl mr-2">⚡</span>
          Recent Activity
        </h2>

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3 p-3 bg-stone-50 rounded-lg">
                <div className="text-lg">
                  {activity.type === 'upload' ? '📸' : '💬'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-800">{activity.description}</div>
                  <div className="text-xs text-stone-500">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🌅</div>
            <p className="text-stone-600">No activity yet—the celebration is just beginning!</p>
          </div>
        )}
      </div>
    </div>
  )
} 