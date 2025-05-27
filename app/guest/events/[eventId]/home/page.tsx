'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGuestEvent } from '@/app/lib/useGuestEvent'
import GuestPhotoGallery from '@/app/components/GuestPhotoGallery'
import GuestMessaging from '@/app/components/GuestMessaging'
import EventSchedule from '@/app/components/EventSchedule'

export default function GuestEventHomePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Get session first
  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.error('❌ Error getting session:', sessionError)
        router.push('/login')
        return
      }

      setCurrentUserId(session.user.id)
    }

    getSession()
  }, [router])

  // Scroll listener for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use the custom hook to fetch event and guest data
  const { event, guestInfo, loading, error, updateRSVP } = useGuestEvent(eventId, currentUserId)

  const handleRSVPUpdate = async (status: string) => {
    const result = await updateRSVP(status)
    
    if (result.success) {
      alert(`RSVP updated to: ${status}`)
    } else {
      alert(result.error || 'Failed to update RSVP. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wedding details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/select-event')}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
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

  const getRSVPStatusColor = (status: string | null) => {
    switch (status) {
      case 'Attending': return 'bg-green-100 text-green-800 border-green-200'
      case 'Declined': return 'bg-red-100 text-red-800 border-red-200'
      case 'Maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className={`sticky top-0 z-40 bg-white border-b transition-all duration-300 ${
        isScrolled 
          ? 'shadow-lg backdrop-blur-sm bg-white/95' 
          : 'shadow-sm'
      }`}>
        <div className="max-w-4xl mx-auto px-4 transition-all duration-300">
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
                  Hosted by {event.host?.full_name || 'Unknown Host'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full border font-medium transition-all duration-300 ${
                isScrolled ? 'text-xs' : 'text-sm'
              } ${getRSVPStatusColor(guestInfo?.rsvp_status || null)}`}>
                RSVP: {guestInfo?.rsvp_status || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                      <h3 className="font-semibold text-gray-900">About</h3>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            <GuestPhotoGallery eventId={eventId} currentUserId={currentUserId} />

            {/* Messaging */}
            <GuestMessaging eventId={eventId} currentUserId={currentUserId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 RSVP</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleRSVPUpdate('Attending')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    guestInfo?.rsvp_status === 'Attending'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  ✅ I'll be there!
                </button>
                
                <button
                  onClick={() => handleRSVPUpdate('Maybe')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    guestInfo?.rsvp_status === 'Maybe'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                  }`}
                >
                  🤔 Maybe
                </button>
                
                <button
                  onClick={() => handleRSVPUpdate('Declined')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    guestInfo?.rsvp_status === 'Declined'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  ❌ Can't make it
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="w-full py-3 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 font-medium transition-colors"
                >
                  💬 Send Direct Message
                </button>
                
                <button className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors">
                  🎁 View Registry
                </button>
                
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full py-3 px-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 border border-pink-200 font-medium transition-colors"
                >
                  📋 Event Schedule
                </button>
              </div>
            </div>

            {/* Host Contact */}
            {event.host && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">👰‍♀️ Host</h2>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {event.host.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {event.host.full_name || 'Unknown Host'}
                    </h3>
                    <p className="text-gray-600 text-sm">Wedding Host</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">💬 Send Direct Message</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To: {event?.host?.full_name || 'Host'}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Write your message to the host..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">📋 Event Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {event && (
                <EventSchedule 
                  eventDate={event.event_date} 
                  location={event.location} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 