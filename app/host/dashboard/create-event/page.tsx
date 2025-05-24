'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Renamed component
export default function CreateEventPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formMessage, setFormMessage] = useState('')

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormMessage('')

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      setFormMessage('Error: You must be logged in to create an event.')
      setIsLoading(false)
      // Optionally redirect to login
      // router.push('/login') 
      return
    }

    const userId = session.user.id

    if (!eventName.trim() || !eventDate.trim()) {
      setFormMessage('Event name and date are required.');
      setIsLoading(false);
      return;
    }

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        title: eventName, // Assuming your table column is 'title' for the event name
        date: eventDate,
        location: eventLocation,
        host_id: userId, // Assuming 'host_id' links to the user who created it
      })
      .select()
      .single()

    setIsLoading(false)

    if (insertError) {
      console.error('Error creating event:', insertError)
      setFormMessage(`Error creating event: ${insertError.message}`)
    } else if (newEvent) {
      setFormMessage('Event created successfully!')
      // Navigate to the main host dashboard or the new event's specific dashboard
      // For now, let's go to the general host dashboard.
      // A more advanced redirect would be to /host/events/${newEvent.id}/dashboard
      router.push('/host/dashboard') 
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">✨ Create New Event</h1>
      <form onSubmit={handleCreateEvent} className="space-y-4">
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date" // Using type="date" for better UX if suitable
            id="eventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">
            Location (Optional)
          </label>
          <input
            type="text"
            id="eventLocation"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
        {formMessage && (
          <p className={`text-sm ${formMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {formMessage}
          </p>
        )}
      </form>
    </main>
  )
}
