import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { type EventWithHost, type EventGuestWithUser } from '@/lib/supabase/types'
import { getEventById, getEventGuests } from '@/services/events'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseEventDetailsReturn {
  event: EventWithHost | null
  guestInfo: EventGuestWithUser | null
  loading: boolean
  error: AppError | null
  updateRSVP: (status: string) => Promise<{ success: boolean; error: string | null }>
  refetch: () => void
}

export function useEventDetails(eventId: string | null, userId: string | null): UseEventDetailsReturn {
  const [event, setEvent] = useState<EventWithHost | null>(null)
  const [guestInfo, setGuestInfo] = useState<EventGuestWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchEventData = useCallback(async () => {
    const wrappedFetch = withErrorHandling(async () => {
      if (!eventId || !userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Fetch event details first (without host join to avoid RLS issues)
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) {
        throw new Error('Failed to load event details')
      }

      // Try to fetch host information separately (may fail due to RLS)
      let hostData = null
      try {
        const { data: hostInfo, error: hostError } = await supabase
          .from('public_user_profiles')
          .select('*')
          .eq('id', eventData.host_user_id)
          .single()
        
        if (!hostError) {
          hostData = hostInfo
        }
      } catch (hostFetchError) {
        // Silently handle host fetch failures
      }

      // Check if user is a guest of this event (fetch without join first)
      const { data: guestDataSimple, error: guestSimpleError } = await supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()

      if (guestSimpleError) {
        console.error('🔍 Simple guest fetch error:', guestSimpleError)
        console.error('🔍 Simple guest error details:', {
          code: guestSimpleError.code,
          message: guestSimpleError.message,
          details: guestSimpleError.details,
          hint: guestSimpleError.hint
        })
        throw new Error('You are not invited to this event')
      }

      // Try to fetch the user profile for the guest separately
      let guestUserProfile = null
      try {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('public_user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (!userProfileError) {
          guestUserProfile = userProfile
        }
      } catch (profileFetchError) {
        // Silently handle profile fetch failures
      }

      // Combine guest data with user profile
      const guestData = {
        ...guestDataSimple,
        user: guestUserProfile
      }

      // Combine event data with host info
      const eventWithHost = {
        ...eventData,
        host: hostData
      }

      setEvent(eventWithHost as EventWithHost)
      setGuestInfo(guestData as EventGuestWithUser)
      setLoading(false)
    }, 'useEventDetails.fetchEventData')

    const result = await wrappedFetch()
    if (result?.error) {
      setError(result.error)
      logError(result.error, 'useEventDetails.fetchEventData')
      setLoading(false)
    }
    return result
  }, [eventId, userId])

  const updateRSVP = useCallback(async (status: string) => {
    if (!guestInfo) return { success: false, error: 'No guest info available' }

    const wrappedUpdate = withErrorHandling(async () => {
      const { error } = await supabase
        .from('event_guests')
        .update({ rsvp_status: status })
        .eq('id', guestInfo.id)

      if (error) {
        throw new Error('Failed to update RSVP')
      }

      // Update local state
      setGuestInfo({ ...guestInfo, rsvp_status: status })
      return { success: true, error: null }
    }, 'useEventDetails.updateRSVP')

    const result = await wrappedUpdate()
    if (result?.error) {
      logError(result.error, 'useEventDetails.updateRSVP')
      return { success: false, error: result.error.message }
    }
    return { success: true, error: null }
  }, [guestInfo])

  const refetch = useCallback(() => {
    if (eventId && userId) {
      fetchEventData()
    }
  }, [fetchEventData, eventId, userId])

  useEffect(() => {
    fetchEventData()
  }, [fetchEventData])

  return {
    event,
    guestInfo,
    loading,
    error,
    updateRSVP,
    refetch,
  }
} 