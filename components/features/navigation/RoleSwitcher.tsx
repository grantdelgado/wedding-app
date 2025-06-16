'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface RoleSwitcherProps {
  currentEventId: string
  currentRole: 'host' | 'guest'
}

export function RoleSwitcher({ currentEventId, currentRole }: RoleSwitcherProps) {
  const router = useRouter()
  const [availableRoles, setAvailableRoles] = useState<string[]>([])

  useEffect(() => {
    async function fetchUserRoles() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's roles for this event
        const { data: participantData } = await supabase
          .from('event_participants')
          .select('role')
          .eq('event_id', currentEventId)
          .eq('user_id', user.id)

        const roles = participantData?.map(p => p.role) || []
        setAvailableRoles(roles)
      } catch (error) {
        console.error('Error fetching user roles:', error)
      }
    }

    fetchUserRoles()
  }, [currentEventId])

  const handleRoleSwitch = (newRole: 'host' | 'guest') => {
    if (newRole === currentRole) return
    
    const basePath = newRole === 'host' ? '/host' : '/guest'
    router.push(`${basePath}/events/${currentEventId}`)
  }

  // Don't show switcher if user only has one role
  if (availableRoles.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg border border-stone-200 p-1">
      {availableRoles.includes('host') && (
        <button
          onClick={() => handleRoleSwitch('host')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currentRole === 'host'
              ? 'bg-purple-100 text-purple-700'
              : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          Host View
        </button>
      )}
      {availableRoles.includes('guest') && (
        <button
          onClick={() => handleRoleSwitch('guest')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currentRole === 'guest'
              ? 'bg-purple-100 text-purple-700'
              : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          Guest View
        </button>
      )}
    </div>
  )
} 