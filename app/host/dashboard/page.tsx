// app/host/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Added for potential redirects
import { supabase } from '@/lib/supabase'    // Added for session
import { useHostEvents } from '@/hooks/events'

export default function HostDashboardPage() { // Renamed component for clarity
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Effect to get current user ID
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.error('HostDashboard: Error getting session or no user, redirecting to login.', sessionError)
        router.push('/login') 
        return
      }
      setCurrentUserId(session.user.id)
    }
    getSession()
  }, [router])

  // Use the useHostEvents hook with the fetched userId
  const { hostedEvents, loading, error } = useHostEvents(currentUserId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-semibold text-stone-800 mb-4">We couldn&apos;t load your dashboard. Please try again.</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-stone-800 mb-2">Host Dashboard</h1>
            <p className="text-stone-600">Manage your wedding events and connect with guests</p>
          </div>
          <Link
            href="/host/events/create"
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200"
          >
            Create New Event
          </Link>
        </div>

        <section>
          <h2 className="text-xl font-medium text-stone-800 mb-6">Your Events</h2>
          {validHostedEvents.length > 0 ? (
            <div className="grid gap-4">
              {validHostedEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-all duration-200">
                  <Link href={`/host/events/${event.id}/dashboard`} className="block">
                    <h3 className="text-xl font-medium text-stone-800 hover:text-stone-900 transition-colors mb-2">{event.title}</h3>
                    {event.event_date && (
                      <p className="text-stone-600 mb-1">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    {event.location && <p className="text-stone-500">{event.location}</p>}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-stone-800 mb-4">No events yet</h3>
              <p className="text-stone-600 mb-2">You haven&apos;t created any wedding events yet.</p>
              <p className="text-stone-500 mb-6">Get started by creating your first wedding hub.</p>
              <Link
                href="/host/events/create"
                className="inline-flex items-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200"
              >
                Create Your First Event
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}