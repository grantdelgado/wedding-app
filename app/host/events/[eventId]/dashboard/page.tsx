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
  EventAnalytics,
  QuickActions,
  NotificationCenter,
  SMSTestPanel
} from '@/components/features/host-dashboard'
import { WelcomeBanner } from '@/components/features/events'

type Event = Database['public']['Tables']['events_new']['Row']

export default function EventDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showGuestImport, setShowGuestImport] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    if (!eventId) return

    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verify user access and fetch event
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events_new')
          .select('*')
          .eq('id', eventId)
          .eq('host_user_id', user.id)
          .single()

        if (eventError) {
          console.error('Event fetch error:', eventError)
          if (eventError.code === 'PGRST116') {
            setError('Event not found or you do not have permission to access it.')
          } else {
            setError('Failed to load event data')
          }
          return
        }

        setEvent(eventData)

        // Get participant count
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', eventId)

        if (participantError) {
          console.error('Participant count error:', participantError)
        } else {
          setParticipantCount(participantData?.length || 0)
        }

      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId, router])

  useEffect(() => {
    // Listen for navigation tab changes from bottom navigation
    const handleNavigationTabChange = (event: CustomEvent) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab)
      }
    }

    const handleDashboardTabChange = (event: CustomEvent) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab)
      }
    }

    window.addEventListener('navigationTabChange', handleNavigationTabChange as EventListener)
    window.addEventListener('dashboardTabChange', handleDashboardTabChange as EventListener)

    return () => {
      window.removeEventListener('navigationTabChange', handleNavigationTabChange as EventListener)
      window.removeEventListener('dashboardTabChange', handleDashboardTabChange as EventListener)
    }
  }, [])

  const handleDataRefresh = async () => {
    // Refresh participant count
    const { data: participantData } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)

    setParticipantCount(participantData?.length || 0)
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-stone-800 mb-2">Unable to Load Event</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/select-event')}
              className="w-full"
            >
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h1 className="text-xl font-semibold text-stone-800 mb-2">Event Not Found</h1>
          <p className="text-stone-600 mb-6">The event you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/select-event')}>
            Back to Events
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Guest Import Modal */}
      {showGuestImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GuestImportWizard
              eventId={eventId}
              onImportComplete={() => {
                setShowGuestImport(false)
                handleDataRefresh()
              }}
              onClose={() => setShowGuestImport(false)}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-stone-200">
          <div className="px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  {event.header_image_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden">
                      <Image
                        src={event.header_image_url}
                        alt={event.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-stone-800 mb-2">{event.title}</h1>
                    <div className="flex items-center space-x-4 text-stone-600">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">📅</span>
                        {formatEventDate(event.event_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <span className="text-xl mr-2">📍</span>
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {event.description && (
                  <p className="text-stone-600 max-w-2xl">{event.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <QuickActions eventId={eventId} />
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="px-6 py-6">
          <WelcomeBanner 
            guestCount={participantCount}
            onImportGuests={() => setShowGuestImport(true)}
            onSendFirstMessage={() => setActiveTab('messages')}
          />
        </div>

        {/* Notifications */}
        <div className="px-6 mb-6">
          <NotificationCenter eventId={eventId} />
        </div>

        {/* Main Content */}
        <div className="px-6 pb-20">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-stone-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                  }`}
                >
                  📊 Overview
                </button>

                <button
                  onClick={() => setActiveTab('guests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'guests'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                  }`}
                >
                  👥 Participants
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
                <div className="space-y-6">
                  <MessageComposer 
                    eventId={eventId}
                    onMessageSent={() => {
                      console.log('Message sent successfully!')
                    }}
                  />
                  <SMSTestPanel eventId={eventId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 