'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/reference/supabase.types'

type Guest = Database['public']['Tables']['guests']['Row']

export default function Home() {
  const [guests, setGuests] = useState<Guest[]>([])

  useEffect(() => {
    const fetchGuests = async () => {
      const { data, error } = await supabase.from('guests').select('*')
      if (error) console.error(error)
      else setGuests(data as Guest[])
    }
    fetchGuests()
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Guest List</h1>
      {guests.length === 0 ? (
        <p>No guests yet.</p>
      ) : (
        <ul className="space-y-2">
          {guests.map((guest) => (
            <li key={guest.id} className="border-b py-2">
              <strong>{guest.full_name}</strong> – {guest.rsvp_status}
              <div className="text-sm text-gray-500">{guest.email} • {guest.tag}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}