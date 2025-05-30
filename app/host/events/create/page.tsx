'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/app/reference/supabase.types'

type EventInsert = Database['public']['Tables']['events']['Insert']

export default function CreateEventPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
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
      setFormMessage('You must be logged in to create an event.')
      setIsLoading(false)
      return
    }

    const userId = session.user.id

    if (!eventName.trim() || !eventDate.trim()) {
      setFormMessage('Event name and date are required.')
      setIsLoading(false)
      return
    }

    // Create the event insert object with correct column names
    const eventData: EventInsert = {
      title: eventName.trim(),
      event_date: eventDate,
      location: eventLocation.trim() || null,
      description: eventDescription.trim() || null,
      host_user_id: userId,
      is_public: isPublic,
    }

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    setIsLoading(false)

    if (insertError) {
      console.error('Error creating event:', insertError)
      setFormMessage('Something went wrong. Please try again.')
    } else if (newEvent) {
      setFormMessage('Wedding hub created successfully!')
      // Navigate to the specific event dashboard
      setTimeout(() => {
        router.push(`/host/events/${newEvent.id}/dashboard`)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-stone-800 mb-4 tracking-tight">
            Create Your Wedding Hub
          </h1>
          <p className="text-lg text-stone-600">
            Set up your wedding communication center and start connecting with your guests
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          <form onSubmit={handleCreateEvent} className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-stone-700 mb-2">
                Wedding/Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Sarah & John's Wedding"
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg"
                required
                disabled={isLoading}
              />
            </div>

            {/* Event Date */}
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-stone-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg"
                required
                disabled={isLoading}
              />
            </div>

            {/* Event Location */}
            <div>
              <label htmlFor="eventLocation" className="block text-sm font-medium text-stone-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., Central Park, New York"
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg"
                disabled={isLoading}
              />
            </div>

            {/* Event Description */}
            <div>
              <label htmlFor="eventDescription" className="block text-sm font-medium text-stone-700 mb-2">
                Description
              </label>
              <textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Tell your guests about your special day..."
                rows={3}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-stone-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-stone-700">
                Make this wedding hub discoverable to guests
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-stone-800 text-white font-medium py-4 px-6 rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Your Wedding Hub...
                  </div>
                ) : (
                  'Create Wedding Hub'
                )}
              </button>
            </div>

            {/* Form Message */}
            {formMessage && (
              <div className={`p-4 rounded-lg text-center text-sm ${
                formMessage.includes('wrong') || formMessage.includes('required') 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {formMessage}
              </div>
            )}
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.back()}
            className="text-stone-600 hover:text-stone-800 font-medium transition-colors"
            disabled={isLoading}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 