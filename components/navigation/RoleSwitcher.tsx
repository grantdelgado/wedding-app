'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface UserEvent {
  id: string
  title: string
  role: 'host' | 'guest'
  event_date: string
}

interface RoleSwitcherProps {
  currentEventId?: string
  currentRole?: 'host' | 'guest'
  className?: string
}

export function RoleSwitcher({ currentEventId, currentRole, className }: RoleSwitcherProps) {
  const router = useRouter()
  const [userEvents, setUserEvents] = useState<UserEvent[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUserEvents = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get events where user is host
        const { data: hostedEvents } = await supabase
          .from('events')
          .select('id, title, event_date')
          .eq('host_user_id', user.id)
          .order('event_date', { ascending: false })

        // Get events where user is guest
        const { data: guestEvents } = await supabase
          .from('event_guests')
          .select('event:events(id, title, event_date)')
          .eq('user_id', user.id)

        const allEvents: UserEvent[] = []

        // Add hosted events
        hostedEvents?.forEach(event => {
          allEvents.push({
            id: event.id,
            title: event.title,
            role: 'host',
            event_date: event.event_date
          })
        })

        // Add guest events
        guestEvents?.forEach(item => {
          const event = item.event as { id: string; title: string; event_date: string } | null
          if (event) {
            allEvents.push({
              id: event.id,
              title: event.title,
              role: 'guest',
              event_date: event.event_date
            })
          }
        })

        // Sort by date (most recent first)
        allEvents.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

        setUserEvents(allEvents)
      } catch (error) {
        console.error('Error fetching user events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserEvents()
  }, [])

  const handleEventSwitch = (event: UserEvent) => {
    const basePath = event.role === 'host' 
      ? `/host/events/${event.id}/dashboard`
      : `/guest/events/${event.id}/home`
    
    router.push(basePath)
    setIsOpen(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleIcon = (role: 'host' | 'guest') => {
    return role === 'host' ? '👑' : '🎊'
  }

  const getRoleColor = (role: 'host' | 'guest') => {
    return role === 'host' 
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-rose-100 text-rose-800 border-rose-200'
  }

  // Only show if user has multiple events or different roles
  if (userEvents.length <= 1) return null

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xs"
        disabled={loading}
      >
        <span>{getRoleIcon(currentRole || 'host')}</span>
        <span>Switch Event</span>
        <svg 
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-lg shadow-xl border border-stone-200 z-50 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800 text-sm">Your Events</h3>
              <p className="text-xs text-stone-600">Switch between your hosted and attended events</p>
            </div>
            
            <div className="py-2">
              {userEvents.map((event) => (
                <button
                  key={`${event.id}-${event.role}`}
                  onClick={() => handleEventSwitch(event)}
                  className={cn(
                    'w-full text-left px-3 py-2 hover:bg-stone-50 transition-colors',
                    currentEventId === event.id && currentRole === event.role && 'bg-stone-100'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{getRoleIcon(event.role)}</span>
                        <span className="font-medium text-stone-800 text-sm truncate">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border',
                          getRoleColor(event.role)
                        )}>
                          {event.role}
                        </span>
                        <span className="text-xs text-stone-500">
                          {formatDate(event.event_date)}
                        </span>
                      </div>
                    </div>
                    
                    {currentEventId === event.id && currentRole === event.role && (
                      <div className="text-green-500 text-sm">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 