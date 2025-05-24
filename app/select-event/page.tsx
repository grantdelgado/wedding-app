'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEvents } from '@/app/lib/useEvents'

type Event = {
  id: string
  title: string
  date: string | null
}

export default function SelectEventPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
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
        .eq('host_id', userId)

      if (!existing?.length) {
        const { data: newEvent } = await supabase
          .from('events')
          .insert({
            title: '🛠️ Debug Test Event',
            date: new Date().toISOString(),
            host_id: userId,
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
    return <div className="p-6 text-center">Loading events...</div>
  }

  if (fetchError) {
    return (
      <div className="p-6 text-center text-red-600">
        ⚠️ There was a problem loading your events. Please try again later. Error: {typeof fetchError === 'string' ? fetchError : JSON.stringify(fetchError)}
      </div>
    )
  }

  const validHostedEvents = hostedEvents || [];
  const validGuestEvents = guestEvents || [];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">🎉 Welcome to Unveil</h1>
      <p className="text-gray-600">Select an event to continue:</p>

      {validHostedEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Events You&apos;re Hosting</h2>
          <ul className="space-y-2">
            {validHostedEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={() => handleSelect(event.id, 'host')}
                  className="w-full p-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {event.title} (Host)
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validGuestEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4 mb-2">Events You&apos;re Attending</h2>
          <ul className="space-y-2">
            {validGuestEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={() => handleSelect(event.id, 'guest')}
                  className="w-full p-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  {event.title} (Guest)
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validHostedEvents.length === 0 && validGuestEvents.length === 0 && (
        <div className="text-gray-500">
          You haven&apos;t joined or created any events yet.
        </div>
      )}
    </div>
  )
}
