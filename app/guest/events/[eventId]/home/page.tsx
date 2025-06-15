'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useEventDetails } from '@/hooks/events'
import { GuestPhotoGallery } from '@/components/features/media'
import { GuestMessaging } from '@/components/features/messaging'
import { EventSchedule } from '@/components/features/scheduling'

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
  const { event, guestInfo, loading, error, updateRSVP } = useEventDetails(eventId, currentUserId)

  const handleRSVPUpdate = async (status: string) => {
    const result = await updateRSVP(status)
    
    if (result.success) {
      // Success feedback handled by the UI state change
    } else {
      alert(result.error || 'Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">We couldn&apos;t find this celebration</h1>
          <p className="text-stone-600 mb-6">{error?.message || 'This wedding hub may have been moved or is no longer available.'}</p>
          <button
            onClick={() => router.push('/select-event')}
            className="px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors font-medium"
          >
            Return to Your Events
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
      case 'Attending': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Declined': return 'bg-stone-100 text-stone-700 border-stone-200'
      case 'Maybe': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-purple-50 text-purple-700 border-purple-200'
    }
  }

  const getRSVPStatusText = (status: string | null) => {
    switch (status) {
      case 'Attending': return 'Celebrating with you'
      case 'Declined': return 'Unable to attend'
      case 'Maybe': return 'Considering'
      default: return 'Awaiting your response'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
      {/* Header */}
      <div className={`sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200/50 transition-all duration-300 ${
        isScrolled 
          ? 'shadow-lg' 
          : 'shadow-sm'
      }`}>
        <div className="max-w-5xl mx-auto px-6 transition-all duration-300">
          <div className={`transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
            <button
              onClick={() => router.push('/select-event')}
              className={`text-stone-500 hover:text-stone-700 font-medium transition-all duration-300 mb-3 ${
                isScrolled ? 'text-sm' : ''
              }`}
            >
              ← Your Events
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`font-semibold text-stone-800 transition-all duration-300 tracking-tight ${
                  isScrolled ? 'text-xl' : 'text-3xl'
                }`}>
                  {event.title}
                </h1>
                <p className={`text-stone-600 transition-all duration-300 ${
                  isScrolled ? 'text-sm' : 'text-base'
                }`}>
                  Hosted by {event.host?.full_name || 'Your hosts'}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full border font-medium transition-all duration-300 ${
                isScrolled ? 'text-xs px-3 py-1' : 'text-sm'
              } ${getRSVPStatusColor(guestInfo?.rsvp_status || null)}`}>
                {getRSVPStatusText(guestInfo?.rsvp_status || null)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-rose-200/50 p-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-stone-800 mb-3">
                  You&apos;re invited to celebrate
                </h2>
                <p className="text-stone-600 text-lg leading-relaxed">
                  We&apos;re so excited to share this special moment with you. Your presence would make our day even more magical.
                </p>
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
              <h2 className="text-xl font-medium text-stone-800 mb-6">Celebration Details</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800 mb-1">When</h3>
                    <p className="text-stone-600 text-lg">{formatDate(event.event_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-800 mb-1">Where</h3>
                      <p className="text-stone-600 text-lg">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-800 mb-1">About this celebration</h3>
                      <p className="text-stone-600 leading-relaxed">{event.description}</p>
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
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-medium text-stone-800 mb-2">Will you be joining us?</h2>
              <p className="text-stone-600 text-sm mb-6">Let us know if you can celebrate with us</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleRSVPUpdate('Attending')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    guestInfo?.rsvp_status === 'Attending'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  Yes, I&apos;ll be there
                </button>
                
                <button
                  onClick={() => handleRSVPUpdate('Maybe')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    guestInfo?.rsvp_status === 'Maybe'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300'
                  }`}
                >
                  I&apos;m not sure yet
                </button>
                
                <button
                  onClick={() => handleRSVPUpdate('Declined')}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    guestInfo?.rsvp_status === 'Declined'
                      ? 'bg-stone-600 text-white shadow-sm'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200 hover:border-stone-300'
                  }`}
                >
                  I can&apos;t make it
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-medium text-stone-800 mb-4">Connect & Explore</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="w-full py-3 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 hover:border-purple-300 font-medium transition-all duration-200"
                >
                  Send a private note
                </button>
                
                <button className="w-full py-3 px-4 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 hover:border-rose-300 font-medium transition-all duration-200">
                  View gift registry
                </button>
                
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full py-3 px-4 bg-stone-50 text-stone-700 rounded-lg hover:bg-stone-100 border border-stone-200 hover:border-stone-300 font-medium transition-all duration-200"
                >
                  View schedule
                </button>
              </div>
            </div>

            {/* Host Contact */}
            {event.host && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-xl font-medium text-stone-800 mb-4">Your Hosts</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-sm">
                    {event.host.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800 text-lg">
                      {event.host.full_name || 'Your hosts'}
                    </h3>
                    <p className="text-stone-600 text-sm">Looking forward to celebrating with you</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-stone-800">Send a private note</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  To: {event?.host?.full_name || 'Your hosts'}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Your message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all resize-none"
                  placeholder="Share your thoughts, ask a question, or send your congratulations..."
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-3 px-4 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 py-3 px-4 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors font-medium">
                  Send message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-stone-200">
            <div className="sticky top-0 bg-white p-6 border-b border-stone-200 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-medium text-stone-800">Celebration Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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