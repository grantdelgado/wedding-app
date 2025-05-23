'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  title: string
  date: string | null
}

type GuestEventRecord = {
  events: Event | null
}

export default function SelectEventPage() {
  const router = useRouter()
  const [hostedEvents, setHostedEvents] = useState<Event[]>([])
  const [guestEvents, setGuestEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    const seedDebugEvent = async (userId: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('title', '🛠️ Debug Test Event')

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

    const run = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.error('❌ Error getting session:', sessionError)
        setFetchError(true)
        return
      }

      const userId = session.user.id

      await seedDebugEvent(userId)

      const { data: hostData, error: hostError } = await supabase
        .from('events')
        .select('id, title, date')
        .eq('host_id', userId)

      if (hostError) {
        console.error('❌ Error fetching hosted events:', hostError)
        setFetchError(true)
      } else {
        setHostedEvents(hostData || [])
      }

      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('events(id, title, date)')
        .eq('user_id', userId)

      if (guestError) {
        console.error('❌ Error fetching guest events:', guestError)
        setFetchError(true)
      } else {
        const formatted = (guestData as unknown as GuestEventRecord[] || [])
          .filter((g): g is { events: Event } => g.events !== null)
          .map((g) => g.events)
        setGuestEvents(formatted)
      }

      setLoading(false)
    }

    run()
  }, [])

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
        ⚠️ There was a problem loading your events. Please try again later.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">🎉 Welcome to Unveil</h1>
      <p className="text-gray-600">Select an event to continue:</p>

      {hostedEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Events You&apos;re Hosting</h2>
          <ul className="space-y-2">
            {hostedEvents.map((event) => (
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

      {guestEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mt-4 mb-2">Events You&apos;re Attending</h2>
          <ul className="space-y-2">
            {guestEvents.map((event) => (
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

      {hostedEvents.length === 0 && guestEvents.length === 0 && (
        <div className="text-gray-500">
          You haven&apos;t joined or created any events yet.
        </div>
      )}
    </div>
  )
}
