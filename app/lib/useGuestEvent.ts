import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/app/reference/supabase.types'

type Event = Database['public']['Tables']['events']['Row']
type EventGuest = Database['public']['Tables']['event_guests']['Row']
type PublicUserProfile = Database['public']['Views']['public_user_profiles']['Row']

export interface EventWithHost extends Event {
  host: PublicUserProfile | null
}

export interface GuestInfo extends EventGuest {
  user: PublicUserProfile | null
}

export function useGuestEvent(eventId: string | null, userId: string | null) {
  const [event, setEvent] = useState<EventWithHost | null>(null)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId || !userId) {
      setLoading(false)
      return
    }

    const fetchEventAndGuestData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event details with host information
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            host:public_user_profiles!events_host_user_id_fkey(*)
          `)
          .eq('id', eventId)
          .single()

        if (eventError) {
          console.error('❌ Error fetching event:', eventError)
          setError('Failed to load event details')
          setLoading(false)
          return
        }

        // Check if user is a guest of this event
        const { data: guestData, error: guestError } = await supabase
          .from('event_guests')
          .select(`
            *,
            user:public_user_profiles(*)
          `)
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .single()

        if (guestError) {
          console.error('❌ Error fetching guest info:', guestError)
          setError('You are not invited to this event')
          setLoading(false)
          return
        }

        setEvent(eventData as EventWithHost)
        setGuestInfo(guestData as GuestInfo)
        setLoading(false)

      } catch (err) {
        console.error('❌ Unexpected error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchEventAndGuestData()
  }, [eventId, userId])

  const updateRSVP = async (status: string) => {
    if (!guestInfo) return { success: false, error: 'No guest info available' }

    try {
      const { error } = await supabase
        .from('event_guests')
        .update({ rsvp_status: status })
        .eq('id', guestInfo.id)

      if (error) {
        console.error('❌ Error updating RSVP:', error)
        return { success: false, error: 'Failed to update RSVP' }
      }

      // Update local state
      setGuestInfo({ ...guestInfo, rsvp_status: status })
      return { success: true, error: null }
    } catch (err) {
      console.error('❌ Unexpected error updating RSVP:', err)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  return {
    event,
    guestInfo,
    loading,
    error,
    updateRSVP,
    refetch: () => {
      if (eventId && userId) {
        setLoading(true)
        // The useEffect will handle the refetch
      }
    }
  }
} 