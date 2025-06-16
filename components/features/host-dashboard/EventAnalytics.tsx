'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type Participant = Database['public']['Tables']['event_participants']['Row']
type Message = Database['public']['Tables']['messages_new']['Row']
type Media = Database['public']['Tables']['media_new']['Row']

interface EventAnalyticsProps {
  eventId: string
}

interface AnalyticsData {
  participants: Participant[]
  messages: Message[]
  media: Media[]
}

export function EventAnalytics({ eventId }: EventAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData>({
    participants: [],
    messages: [],
    media: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all analytics data in parallel
        const [participantsResponse, messagesResponse, mediaResponse] = await Promise.all([
          supabase
            .from('event_participants')
            .select('*')
            .eq('event_id', eventId),
          
          supabase
            .from('messages_new')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false }),
            
          supabase
            .from('media_new')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
        ])

        if (participantsResponse.error) throw participantsResponse.error
        if (messagesResponse.error) throw messagesResponse.error
        if (mediaResponse.error) throw mediaResponse.error

        setData({
          participants: participantsResponse.data || [],
          messages: messagesResponse.data || [],
          media: mediaResponse.data || []
        })
      } catch (err) {
        console.error('Error fetching analytics data:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [eventId])

  const analytics = useMemo(() => {
    const { participants, messages, media } = data

    // RSVP Statistics
    const rsvpStats = {
      total: participants.length,
      attending: participants.filter(p => p.rsvp_status === 'attending').length,
      declined: participants.filter(p => p.rsvp_status === 'declined').length,
      maybe: participants.filter(p => p.rsvp_status === 'maybe').length,
      pending: participants.filter(p => !p.rsvp_status || p.rsvp_status === 'pending').length
    }

    // Engagement Statistics
    const engagementStats = {
      totalMessages: messages.length,
      totalMedia: media.length,
      announcements: messages.filter(m => m.message_type === 'announcement').length,
      directMessages: messages.filter(m => m.message_type === 'direct').length,
      images: media.filter(m => m.media_type === 'image').length,
      videos: media.filter(m => m.media_type === 'video').length
    }

    // Recent Activity
    const recentActivity = [
      ...messages.slice(0, 5).map(m => ({
        type: 'message',
        content: `New ${m.message_type}: ${m.content.substring(0, 50)}...`,
        timestamp: m.created_at
      })),
      ...media.slice(0, 5).map(m => ({
        type: 'media',
        content: `New ${m.media_type} uploaded${m.caption ? `: ${m.caption.substring(0, 30)}...` : ''}`,
        timestamp: m.created_at
      }))
    ].filter(activity => activity.timestamp)
     .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
     .slice(0, 10)

    return {
      rsvpStats,
      engagementStats,
      recentActivity
    }
  }, [data])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-stone-700 mb-2">Failed to load analytics</h3>
          <p className="text-stone-500">{error}</p>
        </div>
      </div>
    )
  }

  const { rsvpStats, engagementStats, recentActivity } = analytics

  return (
    <div className="space-y-6">
      {/* RSVP Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
          <span className="text-2xl mr-2">📊</span>
          RSVP Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-600">{rsvpStats.total}</div>
            <div className="text-sm text-stone-600">Total Invited</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{rsvpStats.attending}</div>
            <div className="text-sm text-stone-600">Attending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">{rsvpStats.maybe}</div>
            <div className="text-sm text-stone-600">Maybe</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{rsvpStats.declined}</div>
            <div className="text-sm text-stone-600">Declined</div>
          </div>
        </div>

        {/* RSVP Progress Bar */}
        <div className="bg-stone-100 rounded-full h-4 overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-green-500" 
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
        <div className="flex justify-between text-xs text-stone-500 mt-2">
          <span>{rsvpStats.pending} still pending</span>
          <span>{Math.round((rsvpStats.attending / rsvpStats.total) * 100)}% response rate</span>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
          <span className="text-2xl mr-2">🎯</span>
          Engagement Metrics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{engagementStats.totalMessages}</div>
            <div className="text-sm text-stone-600">Total Messages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600">{engagementStats.totalMedia}</div>
            <div className="text-sm text-stone-600">Media Uploads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{engagementStats.announcements}</div>
            <div className="text-sm text-stone-600">Announcements</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{engagementStats.images}</div>
            <div className="text-sm text-stone-600">Photos Shared</div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-stone-800">
                {rsvpStats.total > 0 
                  ? Math.round(((engagementStats.totalMessages + engagementStats.totalMedia) / rsvpStats.total) * 100) / 100
                  : 0
                } activities per participant
              </div>
              <div className="text-sm text-stone-600">
                Average engagement across all participants
              </div>
            </div>
            <div className="text-3xl">💝</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
          <span className="text-2xl mr-2">📱</span>
          Recent Activity
        </h2>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">No activity yet</h3>
            <p className="text-stone-500">
              Activity will appear here as participants start engaging with your event
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-stone-50 rounded-lg">
                <div className="text-lg">
                  {activity.type === 'message' ? '💬' : '📸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800 truncate">{activity.content}</p>
                  <p className="text-xs text-stone-500">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">Event Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-stone-700">
              {rsvpStats.total > 0 ? Math.round((rsvpStats.attending / rsvpStats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-stone-600">Expected Attendance</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-stone-700">
              {engagementStats.totalMessages + engagementStats.totalMedia}
            </div>
            <div className="text-xs text-stone-600">Total Interactions</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-stone-700">
              {rsvpStats.pending}
            </div>
            <div className="text-xs text-stone-600">Pending Responses</div>
          </div>
        </div>
      </div>
    </div>
  )
} 