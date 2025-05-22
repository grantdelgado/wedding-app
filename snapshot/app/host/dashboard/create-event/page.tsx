'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  name: string
  date: string
  location: string
}

export default function HostDashboard() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        router.push('/login')
        return
      }

      const { id: userId } = session.user

      const { data, error } = await supabase
        .from('events')
        .select('id, name, date, location')
        .eq('created_by', userId)
        .single()

      if (error) {
        console.log('No existing event found.')
        setEvent(null)
      } else {
        setEvent(data)
      }

      setLoading(false)
    }

    fetchEvent()
  }, [router])

  if (loading) {
    return <div className="p-6 text-lg">Loading your wedding...</div>
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">👰‍♀️ Host Dashboard</h1>

      {event ? (
        <div className="border p-4 rounded bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
          <p className="text-gray-700">📍 {event.location}</p>
          <p className="text-gray-700">📅 {event.date}</p>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">You haven’t created your wedding yet.</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => router.push('/host/event/create')}
          >
            + Create Your Event
          </button>
        </div>
      )}
    </main>
  )
}
