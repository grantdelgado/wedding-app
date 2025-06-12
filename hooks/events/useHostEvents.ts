import { useEffect, useState, useCallback } from 'react'
import { supabase, type Event } from '@/lib/supabase'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseHostEventsReturn {
  hostedEvents: Event[]
  loading: boolean
  error: AppError | null
  refetch: () => Promise<void>
}

export function useHostEvents(userId: string | null): UseHostEventsReturn {
  const [hostedEvents, setHostedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchHostedEvents = useCallback(async () => {
    const wrappedFetch = withErrorHandling(async () => {
      if (!userId) {
        setHostedEvents([])
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

      setHostedEvents(hostData || [])
      setLoading(false)
    }, 'useHostEvents.fetchHostedEvents')

    const result = await wrappedFetch()
    if (result?.error) {
      setError(result.error)
      logError(result.error, 'useHostEvents.fetchHostedEvents')
      setLoading(false)
    }
    return result
  }, [userId])

  const refetch = useCallback(async () => {
    await fetchHostedEvents()
  }, [fetchHostedEvents])

  useEffect(() => {
    if (userId !== null) {
      fetchHostedEvents()
    } else {
      setLoading(false)
    }
  }, [fetchHostedEvents, userId])

  return {
    hostedEvents,
    loading,
    error,
    refetch,
  }
} 