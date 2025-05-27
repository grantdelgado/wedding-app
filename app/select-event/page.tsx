'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEvents } from '@/app/lib/useEvents'
import Link from 'next/link'
import type { Database } from '@/app/reference/supabase.types'

type Event = Database['public']['Tables']['events']['Row']

export default function SelectEventPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Helper function to calculate days until wedding
  const getDaysUntilWedding = (eventDate: string) => {
    const today = new Date()
    const wedding = new Date(eventDate)
    const diffTime = wedding.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to format countdown text
  const getCountdownText = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} days ago`
    } else if (days === 0) {
      return 'Today! 🎉'
    } else if (days === 1) {
      return 'Tomorrow! 🎊'
    } else {
      return `${days} days to go`
    }
  }

  // Helper function to sort events by date (soonest first)
  const sortEventsByDate = (events: Event[]) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.event_date).getTime()
      const dateB = new Date(b.event_date).getTime()
      return dateA - dateB
    })
  }

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.error('❌ Error getting session:', sessionError)
        router.push('/login')
        return
      }
      setCurrentUserId(session.user.id)
    }
    getSession()
  }, [router])

  const { hostedEvents, guestEvents, loading, error: fetchError } = useEvents(currentUserId)

  useEffect(() => {
    const seedDebugEvent = async (userId: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      if (!userId || loading) return;

      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('title', '🛠️ Debug Test Event')
        .eq('host_user_id', userId)

      if (!existing?.length) {
        const { data: newEvent } = await supabase
          .from('events')
          .insert({
            title: '🛠️ Debug Test Event',
            event_date: new Date().toISOString().split('T')[0],
            host_user_id: userId,
          })
          .select()
          .single()

        if (newEvent?.id) {
          await supabase.from('guests').insert({
            user_id: userId,
            event_id: newEvent.id,
            full_name: 'Debug User',
          })
          console.log('✅ Seeded debug event + guest')
        }
      }
    }

    if (currentUserId) {
      seedDebugEvent(currentUserId)
    }
  }, [currentUserId, loading, hostedEvents, guestEvents])

  const handleSelect = (eventId: string, role: 'host' | 'guest') => {
    const path =
      role === 'host'
        ? `/host/events/${eventId}/dashboard`
        : `/guest/events/${eventId}/home`
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your events...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">There was a problem loading your events. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const validHostedEvents = hostedEvents || [];
  const validGuestEvents = guestEvents || [];

  // Sort events by date (soonest first)
  const sortedHostedEvents = sortEventsByDate(validHostedEvents)
  const sortedGuestEvents = sortEventsByDate(validGuestEvents)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="text-4xl mr-3">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome to Unveil</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Select your wedding event to continue, or create a new wedding hub if you&apos;re hosting.
          </p>
        </div>

        {/* Create Wedding Hub Button - Only show if user has no hosted events */}
        {sortedHostedEvents.length === 0 && (
          <div className="text-center mb-16">
            <Link
              href="/host/events/create"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-xl mr-2">+</span>
              Create Your Wedding Hub
            </Link>
          </div>
        )}

        {/* Events Sections */}
        <div className="space-y-12">
          {/* Hosted Events */}
          {sortedHostedEvents.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="text-2xl mr-3">👑</div>
                <h2 className="text-2xl font-bold text-gray-900">Events You&apos;re Hosting</h2>
              </div>
              <div className="grid gap-4">
                {sortedHostedEvents.map((event) => {
                  const daysUntil = getDaysUntilWedding(event.event_date)
                  const countdownText = getCountdownText(daysUntil)
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event.id, 'host')}
                      className="w-full p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl border border-gray-100 transition-all duration-200 transform hover:scale-[1.02] group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {event.title}
                            </h3>
                            <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              Host
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                            daysUntil <= 7 && daysUntil >= 0 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900' 
                              : daysUntil < 0 
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
                          }`}>
                            {countdownText}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Guest Events */}
          {sortedGuestEvents.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="text-2xl mr-3">🎊</div>
                <h2 className="text-2xl font-bold text-gray-900">Events You&apos;re Attending</h2>
              </div>
              <div className="grid gap-4">
                {sortedGuestEvents.map((event) => {
                  const daysUntil = getDaysUntilWedding(event.event_date)
                  const countdownText = getCountdownText(daysUntil)
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event.id, 'guest')}
                      className="w-full p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl border border-gray-100 transition-all duration-200 transform hover:scale-[1.02] group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {event.title}
                            </h3>
                            <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                              Guest
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium">
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                            daysUntil <= 7 && daysUntil >= 0 
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900' 
                              : daysUntil < 0 
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
                          }`}>
                            {countdownText}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {validHostedEvents.length === 0 && validGuestEvents.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-8xl mb-8">💒</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Events Yet</h3>
              <p className="text-lg text-gray-600 mb-2">You haven&apos;t joined or created any wedding events yet.</p>
              <p className="text-gray-500">Get started by creating a wedding hub above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
