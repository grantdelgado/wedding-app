'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserEvent {
  event_id: string
  title: string
  event_date: string
  location: string | null
  user_role: 'host' | 'guest'
  rsvp_status: string | null
  is_primary_host: boolean
}

export default function SimplifiedEventSelectionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }
        
        setUser(user)

        // Get user's events with roles using the simplified function
        const { data: userEvents, error: eventsError } = await supabase
          .rpc('get_user_events')

        if (eventsError) {
          console.error('Error fetching events:', eventsError)
          setError('Failed to load your events. Please try again.')
          return
        }

        setEvents(userEvents || [])
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndEvents()
  }, [router])

  const handleEventSelect = (event: UserEvent) => {
    // Simple role-based routing
    if (event.user_role === 'host') {
      router.push(`/host/events/${event.event_id}/dashboard`)
    } else {
      router.push(`/guest/events/${event.event_id}/home`)
    }
  }

  const handleCreateEvent = () => {
    router.push('/host/events/create')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getRoleDisplay = (event: UserEvent) => {
    if (event.is_primary_host) {
      return { text: 'Host', color: 'bg-rose-100 text-rose-800', icon: '👑' }
    } else if (event.user_role === 'host') {
      return { text: 'Co-Host', color: 'bg-purple-100 text-purple-800', icon: '🤝' }
    } else {
      return { text: 'Guest', color: 'bg-blue-100 text-blue-800', icon: '🎉' }
    }
  }

  const getRSVPDisplay = (status: string | null) => {
    switch (status) {
      case 'attending':
        return { text: 'Attending', color: 'text-green-600' }
      case 'declined':
        return { text: 'Declined', color: 'text-red-600' }
      case 'maybe':
        return { text: 'Maybe', color: 'text-amber-600' }
      default:
        return { text: 'Pending', color: 'text-stone-600' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Your Events</h1>
            <p className="text-stone-600 text-sm">Choose an event to continue</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-stone-600 hover:text-stone-800 text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">No events found</h2>
              <p className="text-stone-600 mb-6">
                You haven&apos;t been invited to any events yet.
              </p>
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-colors"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <>
              {events.map((event) => {
                const role = getRoleDisplay(event)
                const rsvp = getRSVPDisplay(event.rsvp_status)
                
                return (
                  <button
                    key={event.event_id}
                    onClick={() => handleEventSelect(event)}
                    className="w-full p-6 bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900">
                            {event.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                            <span>{role.icon}</span>
                            {role.text}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-stone-600">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{formatEventDate(event.event_date)}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.user_role === 'guest' && event.rsvp_status && (
                            <div className="flex items-center gap-2">
                              <span>✉️</span>
                              <span className={`font-medium ${rsvp.color}`}>
                                {rsvp.text}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
                        →
                      </div>
                    </div>
                  </button>
                )
              })}
              
              {/* Create New Event Button */}
              <button
                onClick={handleCreateEvent}
                className="w-full p-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-600 hover:border-stone-400 hover:text-stone-700 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">+</span>
                  <span className="font-medium">Create New Event</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 