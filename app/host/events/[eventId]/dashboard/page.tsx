'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/LoadingSpinner'
import { GuestImportWizard } from '@/components/features/guests'
import { formatEventDate } from '@/lib/utils'
import type { Database } from '@/app/reference/supabase.types'
import { 
  GuestManagement,
  MessageComposer,
  SubEventManagement,
  EventAnalytics,
  QuickActions,
  NotificationCenter,
  WelcomeBanner
} from '@/components/features/events'

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
  const [subEventCount, setSubEventCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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

        // Fetch sub-events count for welcome banner
        const { data: subEventsData, error: subEventsError } = await supabase
          .from('sub_events')
          .select('id')
          .eq('event_id', eventId)

        if (!subEventsError) {
          setSubEventCount(subEventsData?.length || 0)
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

  const handleDataRefresh = () => {
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
              <div className="flex items-center space-x-3">
                <NotificationCenter eventId={eventId} />
                <div className={`px-3 py-1 rounded-full border font-medium transition-all duration-300 ${
                  isScrolled ? 'text-xs' : 'text-sm'
                } bg-purple-100 text-purple-800 border-purple-200`}>
                  Host
                </div>
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
              priority
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
        {/* Welcome Banner for new hosts */}
        <WelcomeBanner
          guestCount={guestCount}
          hasSubEvents={subEventCount > 0}
          onImportGuests={() => setShowImportWizard(true)}
          onSetupEvents={() => setActiveTab('events')}
          onSendFirstMessage={() => setActiveTab('messages')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200">
              <div className="border-b border-stone-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'overview'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    📊 Analytics
                  </button>
                  <button
                    onClick={() => setActiveTab('guests')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'guests'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    👥 Guests
                  </button>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'messages'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    💬 Messages
                  </button>
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'events'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    🎉 Schedule
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'overview' && (
                  <EventAnalytics eventId={eventId} />
                )}

                {activeTab === 'guests' && (
                  <GuestManagement 
                    eventId={eventId}
                    onGuestUpdated={handleDataRefresh}
                  />
                )}

                {activeTab === 'messages' && (
                  <MessageComposer 
                    eventId={eventId}
                    onMessageScheduled={() => {
                      // Show success message or refresh
                      console.log('Message scheduled successfully!')
                    }}
                  />
                )}

                {activeTab === 'events' && (
                  <SubEventManagement 
                    eventId={eventId}
                    onSubEventUpdated={() => {
                      // Refresh data
                      console.log('Sub-event updated!')
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions 
              eventId={eventId}
              guestCount={guestCount}
              pendingRSVPs={rsvpCounts.pending}
              onActionComplete={handleDataRefresh}
            />

            {/* Event Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-xl mr-2">📅</span>
                Event Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-lg">📅</div>
                  <div>
                    <h3 className="font-medium text-stone-800 text-sm">Date</h3>
                    <p className="text-stone-600 text-sm">{formatEventDate(event.event_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">📍</div>
                    <div>
                      <h3 className="font-medium text-stone-800 text-sm">Location</h3>
                      <p className="text-stone-600 text-sm">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{guestCount}</div>
                    <div className="text-sm text-stone-600">Total Guests</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-emerald-600">{rsvpCounts.attending}</div>
                      <div className="text-xs text-stone-600">Attending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-amber-600">{rsvpCounts.maybe}</div>
                      <div className="text-xs text-stone-600">Maybe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-stone-600">{rsvpCounts.pending}</div>
                      <div className="text-xs text-stone-600">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl border border-purple-200 p-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center">
                <span className="text-xl mr-2">💝</span>
                Need Help?
              </h2>
              
              <div className="space-y-3 text-sm">
                <p className="text-stone-600">
                  We&apos;re here to make your wedding planning seamless and beautiful.
                </p>
                
                <div className="space-y-2">
                  <button className="text-purple-600 hover:text-purple-700 font-medium">
                    📚 View Setup Guide
                  </button>
                  <br />
                  <button className="text-purple-600 hover:text-purple-700 font-medium">
                    💬 Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 