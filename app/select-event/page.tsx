'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
// import type { User } from '@supabase/supabase-js' // Not needed

interface UserEvent {
  event_id: string
  title: string
  event_date: string
  location: string | null
  user_role: string | null
  rsvp_status: string | null
  is_primary_host: boolean
}

export default function SelectEventPage() {
  // const [user, setUser] = useState<User | null>(null) // Removed as not needed
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
        
        // setUser(user) // Not needed as we only check authentication

        // Get user's events with roles using the simplified RLS function
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
    if (!event.user_role) {
      setError('Unable to determine your role for this event.')
      return
    }

    // Route based on user's role for this event
    if (event.user_role === 'host') {
      router.push(`/host/events/${event.event_id}/dashboard`)
    } else if (event.user_role === 'guest') {
      router.push(`/guest/events/${event.event_id}/home`)
    } else {
      setError('Invalid role for this event.')
    }
  }

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
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
        return { text: 'Attending', color: 'bg-green-100 text-green-800' }
      case 'declined':
        return { text: 'Declined', color: 'bg-red-100 text-red-800' }
      case 'maybe':
        return { text: 'Maybe', color: 'bg-amber-100 text-amber-800' }
      default:
        return { text: 'Pending', color: 'bg-stone-100 text-stone-800' }
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
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-stone-800 mb-2 tracking-tight">
            Welcome back
          </h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto mb-4"></div>
          <p className="text-stone-600">
            Choose an event to access your personalized experience
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Events List */}
        <div className="max-w-2xl mx-auto">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">No events found</h2>
              <p className="text-stone-600 mb-6">
                You haven&apos;t been invited to any events yet, or you haven&apos;t created any events.
              </p>
              <button
                onClick={() => router.push('/host/events/create')}
                className="inline-flex items-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-all duration-200"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
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
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
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
                          
                          {event.user_role === 'guest' && (
                            <div className="flex items-center gap-2">
                              <span>✉️</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rsvp.color}`}>
                                RSVP: {rsvp.text}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="max-w-2xl mx-auto mt-8 pt-6 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/host/events/create')}
              className="inline-flex items-center justify-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-all duration-200"
            >
              <span className="mr-2">+</span>
              Create New Event
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-stone-700 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-all duration-200"
            >
              <span className="mr-2">👤</span>
              View Profile
            </button>
            
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-stone-700 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-all duration-200"
            >
              <span className="mr-2">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
