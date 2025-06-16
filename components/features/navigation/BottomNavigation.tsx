'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { RoleSwitcher } from './RoleSwitcher'

interface BottomNavigationProps {
  eventId: string
  role: 'host' | 'guest'
  className?: string
}

export function BottomNavigation({ eventId, role, className }: BottomNavigationProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [userRole, setUserRole] = useState<'host' | 'guest' | null>(null)
  const [eventTitle, setEventTitle] = useState<string>('')

  useEffect(() => {
    // Fetch unread message count (simplified - just get recent message count)
    async function fetchUnreadCount() {
      try {
        const { data: messages } = await supabase
          .from('messages_new')
          .select('id')
          .eq('event_id', eventId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

        setUnreadCount(messages?.length || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`messages:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages_new',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  useEffect(() => {
    const determineUserRole = async () => {
      if (!eventId) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user is host of this event
        const { data: hostEvent } = await supabase
          .from('events')
          .select('title, host_user_id')
          .eq('id', eventId)
          .eq('host_user_id', user.id)
          .single()

        if (hostEvent) {
          setUserRole('host')
          setEventTitle(hostEvent.title)
        } else {
          // Check if user is guest of this event
          const { data: guestEvent } = await supabase
            .from('event_participants')
            .select('event:events(title)')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()

          if (guestEvent) {
            setUserRole('guest')
            const event = guestEvent.event as unknown as { title: string } | null
            setEventTitle(event?.title || '')
          }
        }
      } catch (error) {
        console.error('Error determining user role:', error)
      }
    }

    determineUserRole()
  }, [eventId])

  // Listen for external tab change events (from host dashboard)
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail
      // Update URL with new tab
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('tab', tab)
      window.history.replaceState({}, '', newUrl.toString())
    }

    window.addEventListener('dashboardTabChange', handleTabChange as EventListener)
    
    return () => {
      window.removeEventListener('dashboardTabChange', handleTabChange as EventListener)
    }
  }, [])

  const basePath = role === 'host' ? `/host/events/${eventId}` : `/guest/events/${eventId}`

  const navItems = [
    {
      href: `${basePath}`,
      icon: '🏠',
      label: 'Home',
      isActive: pathname === basePath
    },
    {
      href: `${basePath}/photos`,
      icon: '📸',
      label: 'Photos',
      isActive: pathname.includes('/photos')
    },
    {
      href: `${basePath}/messages`,
      icon: '💬',
      label: 'Messages',
      isActive: pathname.includes('/messages'),
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    ...(role === 'host' ? [
      {
        href: `${basePath}/dashboard`,
        icon: '⚙️',
        label: 'Manage',
        isActive: pathname.includes('/dashboard')
      }
    ] : [
      {
        href: `${basePath}/rsvp`,
        icon: '✅',
        label: 'RSVP',
        isActive: pathname.includes('/rsvp')
      }
    ])
  ]

  // Don't render navigation on certain pages
  const hideNavigationPaths = ['/login', '/select-event', '/host/events/create', '/reset-password']
  const shouldHideNavigation = hideNavigationPaths.some(path => pathname.startsWith(path))

  if (shouldHideNavigation || !userRole || navItems.length === 0) {
    return null
  }

  // Role-specific styling
  const roleStyles = {
    host: {
      container: 'bg-gradient-to-r from-purple-600 to-rose-600',
      roleIndicator: 'bg-purple-100 text-purple-800',
      activeItem: 'bg-white/20 text-white',
      inactiveItem: 'text-white/70 hover:text-white hover:bg-white/10'
    },
    guest: {
      container: 'bg-gradient-to-r from-rose-500 to-pink-500',
      roleIndicator: 'bg-rose-100 text-rose-800',
      activeItem: 'bg-white/20 text-white',
      inactiveItem: 'text-white/70 hover:text-white hover:bg-white/10'
    }
  }

  const styles = roleStyles[userRole]

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 backdrop-blur-md',
      styles.container,
      className
    )}>
      {/* Role Indicator Header */}
      <div className="px-4 py-2 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
              styles.roleIndicator
            )}>
              {userRole} Mode
            </div>
            <div className="text-white/90 text-sm font-medium truncate">
              {eventTitle}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Role Switcher */}
                        <div className="shrink-0">
              <RoleSwitcher
                currentEventId={eventId}
                currentRole={userRole}
              />
            </div>
            
            {/* Mode indicator icon */}
            <div className="text-white/60 text-sm">
              {userRole === 'host' ? '👑' : '🎊'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 relative min-w-[60px]',
                item.isActive ? styles.activeItem : styles.inactiveItem
              )}
            >
              {/* Badge for notifications */}
              {item.badge && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
              
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Safe area spacing for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  )
} 