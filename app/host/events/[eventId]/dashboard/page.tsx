'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/app/reference/supabase.types'

type Event = Database['public']['Tables']['events']['Row']

export default function EventDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.error('❌ Error getting session:', sessionError)
          router.push('/login')
          return
        }

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('host_user_id', session.user.id) // Ensure user is the host
          .single()

        if (eventError) {
          console.error('❌ Error fetching event:', eventError)
          setError('Event not found or you do not have permission to view it')
          setLoading(false)
          return
        }

        setEvent(eventData)
        setLoading(false)

      } catch (err) {
        console.error('❌ Unexpected error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId, router])

  // Scroll listener for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/select-event')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className={`sticky top-0 z-40 bg-white border-b transition-all duration-300 ${
        isScrolled 
          ? 'shadow-lg backdrop-blur-sm bg-white/95' 
          : 'shadow-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-4 transition-all duration-300">
          <div className={`transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
            <button
              onClick={() => router.push('/select-event')}
              className={`text-gray-600 hover:text-gray-800 font-medium transition-all duration-300 ${
                isScrolled ? 'text-sm mb-1' : 'mb-2'
              }`}
            >
              ← Back to Events
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`font-bold text-gray-900 transition-all duration-300 ${
                  isScrolled ? 'text-xl' : 'text-3xl'
                }`}>
                  {event.title}
                </h1>
                <p className={`text-gray-600 transition-all duration-300 ${
                  isScrolled ? 'text-sm' : ''
                }`}>
                  Host Dashboard
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full border font-medium transition-all duration-300 ${
                isScrolled ? 'text-xs' : 'text-sm'
              } bg-blue-100 text-blue-800 border-blue-200`}>
                Host
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📅</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Date</h3>
                    <p className="text-gray-600">{formatDate(event.event_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📍</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Location</h3>
                      <p className="text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">💌</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Description</h3>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Guests</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">RSVPs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Photos</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">0</div>
                  <div className="text-sm text-gray-600">Messages</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors">
                  👥 Manage Guests
                </button>
                
                <button className="w-full py-3 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium transition-colors">
                  📧 Send Invitations
                </button>
                
                <button className="w-full py-3 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 font-medium transition-colors">
                  📸 View Gallery
                </button>
                
                <button className="w-full py-3 px-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 border border-pink-200 font-medium transition-colors">
                  💬 Messages
                </button>
              </div>
            </div>

            {/* Event Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Settings</h2>
              
              <div className="space-y-3">
                <button className="w-full py-2 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  ✏️ Edit Event Details
                </button>
                
                <button className="w-full py-2 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  🔒 Privacy Settings
                </button>
                
                <button className="w-full py-2 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  📋 Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 