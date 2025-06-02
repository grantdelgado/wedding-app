'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/LoadingSpinner'
import { GuestImportWizard } from '@/components/guest-import'
import { formatEventDate } from '@/lib/utils'
import type { Database } from '@/app/reference/supabase.types'

type Event = Database['public']['Tables']['events']['Row']

export default function EventDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const [event, setEvent] = useState<Event | null>(null)
  const [guestCount, setGuestCount] = useState(0)
  const [rsvpCounts, setRsvpCounts] = useState({
    attending: 0,
    declined: 0,
    maybe: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportWizard, setShowImportWizard] = useState(false)
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

        // Fetch guest statistics
        const { data: guestData, error: guestError } = await supabase
          .from('event_guests')
          .select('rsvp_status')
          .eq('event_id', eventId)

        if (guestError) {
          console.error('❌ Error fetching guests:', guestError)
        } else {
          setGuestCount(guestData.length)
          
          const counts = guestData.reduce((acc, guest) => {
            const status = guest.rsvp_status?.toLowerCase() || 'pending'
            if (status === 'attending') acc.attending++
            else if (status === 'declined') acc.declined++
            else if (status === 'maybe') acc.maybe++
            else acc.pending++
            return acc
          }, { attending: 0, declined: 0, maybe: 0, pending: 0 })
          
          setRsvpCounts(counts)
        }

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

  const handleImportSuccess = () => {
    setShowImportWizard(false)
    // Refresh the page data
    window.location.reload()
  }

  if (loading) {
    return <LoadingPage message="Loading event dashboard..." />
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-4">Oops!</h1>
          <p className="text-stone-600 mb-6">{error || 'Event not found'}</p>
          <Button onClick={() => router.push('/select-event')}>
            Back to Events
          </Button>
        </div>
      </div>
    )
  }

  if (showImportWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 py-8">
        <GuestImportWizard
          eventId={eventId}
          onSuccess={handleImportSuccess}
          onCancel={() => setShowImportWizard(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
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
              className={`text-stone-600 hover:text-stone-800 font-medium transition-all duration-300 ${
                isScrolled ? 'text-sm mb-1' : 'mb-2'
              }`}
            >
              ← Back to Events
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`font-bold text-stone-800 transition-all duration-300 ${
                  isScrolled ? 'text-xl' : 'text-3xl'
                }`}>
                  {event.title}
                </h1>
                <p className={`text-stone-600 transition-all duration-300 ${
                  isScrolled ? 'text-sm' : ''
                }`}>
                  Host Dashboard
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full border font-medium transition-all duration-300 ${
                isScrolled ? 'text-xs' : 'text-sm'
              } bg-purple-100 text-purple-800 border-purple-200`}>
                Host
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Image Section */}
      {event.header_image_url && (
        <div className="relative">
          <div className="h-64 md:h-80 lg:h-96 overflow-hidden">
            <Image
              src={event.header_image_url}
              alt={`${event.title} header`}
              className="w-full h-full object-cover"
              width={1280}
              height={720}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {event.title}
              </h2>
              <p className="text-lg md:text-xl opacity-90 drop-shadow">
                {formatEventDate(event.event_date)}
              </p>
              {event.location && (
                <p className="text-base md:text-lg opacity-90 drop-shadow flex items-center mt-1">
                  <span className="mr-1">📍</span>
                  {event.location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Event Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📅</div>
                  <div>
                    <h3 className="font-medium text-stone-800">Date</h3>
                    <p className="text-stone-600">{formatEventDate(event.event_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📍</div>
                    <div>
                      <h3 className="font-medium text-stone-800">Location</h3>
                      <p className="text-stone-600">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">💌</div>
                    <div>
                      <h3 className="font-medium text-stone-800">Description</h3>
                      <p className="text-stone-600">{event.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Quick Stats
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{guestCount}</div>
                  <div className="text-sm text-blue-800">Total Guests</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{rsvpCounts.attending}</div>
                  <div className="text-sm text-green-800">Attending</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">{rsvpCounts.maybe}</div>
                  <div className="text-sm text-amber-800">Maybe</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{rsvpCounts.pending}</div>
                  <div className="text-sm text-purple-800">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-xl mr-2">⚡</span>
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowImportWizard(true)}
                >
                  <span className="mr-2">📤</span>
                  Import Guest List
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <span className="mr-2">👥</span>
                  Manage Guests
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <span className="mr-2">📧</span>
                  Send Invitations
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <span className="mr-2">📸</span>
                  View Gallery
                </Button>
                
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <span className="mr-2">💬</span>
                  Messages
                </Button>
              </div>
            </div>

            {/* Event Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-xl mr-2">⚙️</span>
                Settings
              </h2>
              
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/host/events/${eventId}/edit`)}
                  className="w-full py-2 px-3 text-left text-stone-700 hover:bg-stone-50 rounded-lg transition-colors text-sm"
                >
                  <span className="mr-2">✏️</span>
                  Edit Event Details
                </button>
                
                <button className="w-full py-2 px-3 text-left text-stone-700 hover:bg-stone-50 rounded-lg transition-colors text-sm">
                  <span className="mr-2">🔒</span>
                  Privacy Settings
                </button>
                
                <button className="w-full py-2 px-3 text-left text-stone-700 hover:bg-stone-50 rounded-lg transition-colors text-sm">
                  <span className="mr-2">📋</span>
                  Export Data
                </button>
              </div>
            </div>

            {/* Getting Started */}
            {guestCount === 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-rose-50 border border-purple-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  🚀 Getting Started
                </h3>
                <p className="text-stone-600 text-sm mb-4">
                  Ready to invite your guests? Start by importing your guest list from a spreadsheet.
                </p>
                <Button 
                  size="sm"
                  onClick={() => setShowImportWizard(true)}
                  className="w-full"
                >
                  Import Your Guest List
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 