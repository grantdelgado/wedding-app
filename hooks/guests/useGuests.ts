import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { type EventGuestWithUser } from '@/lib/supabase/types'
import { getEventGuests } from '@/services/events'
import { linkGuestToUser } from '@/lib/supabase/guests'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseGuestsReturn {
  guests: EventGuestWithUser[]
  loading: boolean
  error: AppError | null
  linkGuest: (eventId: string, phone: string) => Promise<{ success: boolean; error: string | null }>
  refetch: () => Promise<void>
}

export function useGuests(eventId: string | null): UseGuestsReturn {
  const [guests, setGuests] = useState<EventGuestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('⚠️ No authenticated user for guests')
        setGuests([])
        setLoading(false)
        return
      }

      const { data, error: guestsError } = await getEventGuests(eventId)

      if (guestsError) {
        // Handle permission errors gracefully
        if (guestsError.code === 'PGRST301' || guestsError.message?.includes('permission')) {
          console.warn('⚠️ No permission to access guests for this event')
          setGuests([])
          setLoading(false)
          return
        }
        throw new Error(guestsError.message || 'Failed to fetch guests')
      }

      setGuests(data || [])
      setLoading(false)
    } catch (err) {
      console.warn('⚠️ useGuests fetchGuests error:', err)
      setGuests([])
      setLoading(false)
    }
  }, [eventId])

  const linkGuest = useCallback(async (eventId: string, phone: string) => {
    const wrappedLink = withErrorHandling(async () => {
      const { error } = await linkGuestToUser(eventId, phone)

      if (error) {
        throw new Error('Failed to link guest account')
      }

      // Refresh guests list after successful linking
      await fetchGuests()
      return { success: true, error: null }
    }, 'useGuests.linkGuest')

    const result = await wrappedLink()
    if (result?.error) {
      logError(result.error, 'useGuests.linkGuest')
      return { success: false, error: result.error.message }
    }
    return { success: true, error: null }
  }, [fetchGuests])

  const refetch = useCallback(async () => {
    await fetchGuests()
  }, [fetchGuests])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  return {
    guests,
    loading,
    error,
    linkGuest,
    refetch,
  }
} 