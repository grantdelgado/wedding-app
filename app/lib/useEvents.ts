import { useEffect, useState, useCallback } from 'react'
import { supabase, type Event, type EventGuestWithEvent } from '@/lib/supabase'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseEventsReturn {
  hostedEvents: Event[]
  guestEvents: Event[]
  loading: boolean
  error: AppError | null
  refetch: () => Promise<void>
}

export function useEvents(userId: string | null): UseEventsReturn {
  const [hostedEvents, setHostedEvents] = useState<Event[]>([])
  const [guestEvents, setGuestEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchEvents = useCallback(async () => {
    const wrappedFetch = withErrorHandling(async () => {
      if (!userId) {
        setHostedEvents([])
        setGuestEvents([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Fetch hosted events
      const { data: hostData, error: hostError } = await supabase
        .from('events')
        .select('*')
        .eq('host_user_id', userId)
        .order('event_date', { ascending: true })

      if (hostError) {
        throw hostError
      }

      // Fetch guest events
      const { data: guestData, error: guestError } = await supabase
        .from('event_guests')
        .select(`
          *,
          events:events(*)
        `)
        .eq('user_id', userId)

      if (guestError) {
        throw guestError
      }

      // Format guest events data
      const formattedGuestEvents = ((guestData as EventGuestWithEvent[]) || [])
        .map(g => g.events)
        .filter((e): e is Event => e !== null)
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

      setHostedEvents(hostData || [])
      setGuestEvents(formattedGuestEvents)
      setLoading(false)
    }, 'useEvents.fetchEvents')

    const result = await wrappedFetch()
    if (result?.error) {
      setError(result.error)
      logError(result.error, 'useEvents.fetchEvents')
      setLoading(false)
    }
    return result
  }, [userId])

  const refetch = useCallback(async () => {
    await fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (userId !== null) {
      fetchEvents()
    } else {
      setLoading(false)
    }
  }, [fetchEvents, userId])

  return {
    hostedEvents,
    guestEvents,
    loading,
    error,
    refetch,
  }
} 