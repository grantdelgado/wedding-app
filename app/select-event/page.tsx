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

  // Helper function to format countdown text with more elegant language
  const getCountdownText = (days: number) => {
    if (days < 0) {
      const daysPast = Math.abs(days)
      if (daysPast === 1) return 'Yesterday'
      if (daysPast <= 100) return `${daysPast} days ago`
      
      const monthsPast = Math.floor(daysPast / 30)
      const remainingDays = daysPast % 30
      if (monthsPast < 12) {
        if (remainingDays === 0) return `${monthsPast} month${monthsPast > 1 ? 's' : ''} ago`
        return `${monthsPast}m ${remainingDays}d ago`
      }
      
      const yearsPast = Math.floor(daysPast / 365)
      const remainingMonths = Math.floor((daysPast % 365) / 30)
      if (remainingMonths === 0) return `${yearsPast} year${yearsPast > 1 ? 's' : ''} ago`
      return `${yearsPast}y ${remainingMonths}m ago`
    } else if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Tomorrow'
    } else if (days <= 100) {
      return `${days} days away`
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''} away`
      return `${months}m ${remainingDays}d away`
    } else {
      const years = Math.floor(days / 365)
      const remainingMonths = Math.floor((days % 365) / 30)
      if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''} away`
      return `${years}y ${remainingMonths}m away`
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your celebrations...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-semibold text-stone-800 mb-4">We&apos;re having trouble connecting</h1>
          <p className="text-stone-600 mb-6">We couldn&apos;t load your celebrations right now. Please try again in a moment.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-stone-800 mb-4 tracking-tight">
            unveil
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto mb-6"></div>
          <p className="text-xl text-stone-700 max-w-2xl mx-auto leading-relaxed mb-2">
            Welcome to your celebration hub
          </p>
          <p className="text-stone-600 max-w-xl mx-auto">
            Choose a celebration to continue, or create your first wedding hub to get started.
          </p>
        </div>

        {/* Create Wedding Hub Button - Only show if user has no hosted events */}
        {sortedHostedEvents.length === 0 && (
          <div className="text-center mb-12">
            <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-rose-200/50 p-6 mb-6">
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Ready to create something magical?</h2>
              <p className="text-stone-600 mb-4 max-w-lg mx-auto">
                Start your wedding hub and bring your guests together in one beautiful space.
              </p>
              <Link
                href="/host/events/create"
                className="inline-flex items-center justify-center px-8 py-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Create Your Wedding Hub
              </Link>
            </div>
          </div>
        )}

        {/* Events Sections */}
        <div className="space-y-8">
          {/* Hosted Events */}
          {sortedHostedEvents.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-stone-800 mb-1">Your Wedding Hubs</h2>
                <p className="text-stone-600">Celebrations you&apos;re hosting and managing</p>
              </div>
              <div className="grid gap-4">
                {sortedHostedEvents.map((event) => {
                  const daysUntil = getDaysUntilWedding(event.event_date)
                  const countdownText = getCountdownText(daysUntil)
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event.id, 'host')}
                      className="w-full p-6 rounded-2xl bg-gradient-to-br from-white to-stone-50/50 shadow-sm hover:shadow-xl border border-stone-200/60 hover:border-stone-300/80 transition-all duration-300 group text-left transform hover:scale-[1.02] active:scale-[0.98] relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900 transition-colors leading-tight">
                            {event.title}
                          </h3>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${
                          daysUntil <= 7 && daysUntil >= 0 
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200/60' 
                            : daysUntil < 0 
                              ? 'bg-gradient-to-r from-stone-50 to-stone-100 text-stone-600 border border-stone-200/60'
                              : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-200/60'
                        }`}>
                          {countdownText}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-stone-600 text-base font-medium">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-stone-500 text-sm">{event.location}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Subtle tap indicator */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-5 h-5 rounded-full bg-stone-800/10 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {/* Add new event link for existing hosts */}
              <div className="mt-4 text-center">
                <Link
                  href="/host/events/create"
                  className="inline-flex items-center text-stone-600 hover:text-stone-800 font-medium transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create another wedding hub
                </Link>
              </div>
            </div>
          )}

          {/* Guest Events */}
          {sortedGuestEvents.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-stone-800 mb-1">Your Invitations</h2>
                <p className="text-stone-600">Celebrations you&apos;re invited to attend</p>
              </div>
              <div className="grid gap-4">
                {sortedGuestEvents.map((event) => {
                  const daysUntil = getDaysUntilWedding(event.event_date)
                  const countdownText = getCountdownText(daysUntil)
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event.id, 'guest')}
                      className="w-full p-6 rounded-2xl bg-gradient-to-br from-white to-stone-50/50 shadow-sm hover:shadow-xl border border-stone-200/60 hover:border-stone-300/80 transition-all duration-300 group text-left transform hover:scale-[1.02] active:scale-[0.98] relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900 transition-colors leading-tight">
                            {event.title}
                          </h3>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${
                          daysUntil <= 7 && daysUntil >= 0 
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200/60' 
                            : daysUntil < 0 
                              ? 'bg-gradient-to-r from-stone-50 to-stone-100 text-stone-600 border border-stone-200/60'
                              : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-200/60'
                        }`}>
                          {countdownText}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-stone-600 text-base font-medium">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-stone-500 text-sm">{event.location}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Subtle tap indicator */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-5 h-5 rounded-full bg-stone-800/10 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-semibold text-stone-800 mb-4">Your celebration journey begins here</h3>
                <p className="text-stone-600 mb-2">You haven&apos;t created or joined any wedding celebrations yet.</p>
                <p className="text-stone-500 mb-8">Start by creating your first wedding hub to bring your guests together.</p>
                <Link
                  href="/host/events/create"
                  className="inline-flex items-center justify-center px-8 py-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Create Your First Wedding Hub
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
