// app/host/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Added for potential redirects
import { supabase } from '@/lib/supabase'    // Added for session
import { useEvents } from '@/app/lib/useEvents' // Added useEvents hook

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

  // Use the useEvents hook with the fetched userId
  const { hostedEvents, loading, error } = useEvents(currentUserId)

  if (loading) {
    return <div className="p-6 text-center">Loading your dashboard...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        ⚠️ There was a problem loading your dashboard. Please try again later. Error: {typeof error === 'string' ? error : JSON.stringify(error)}
      </div>
    )
  }
  
  const validHostedEvents = hostedEvents || [];

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👰‍♀️ Host Dashboard</h1>
        <Link
          href="/host/dashboard/create-event"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + New Event
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Your Events</h2>
        {validHostedEvents.length > 0 ? (
          <ul className="space-y-3">
            {validHostedEvents.map((event) => (
              <li key={event.id} className="p-4 border rounded-lg shadow hover:shadow-md transition">
                <Link href={`/host/events/${event.id}/dashboard`} className="block">
                  <h3 className="text-lg font-semibold text-blue-700 hover:underline">{event.title}</h3>
                  {event.date && <p className="text-sm text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>}
                  {event.location && <p className="text-sm text-gray-500">Location: {event.location}</p>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
            <p className="text-gray-500">Why not create one now?</p>
            {/* The "+ New Event" button is already in the header, so might not be needed here again */}
          </div>
        )}
      </section>
    </main>
  )
}