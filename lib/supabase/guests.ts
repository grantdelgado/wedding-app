import { supabase } from './client'
import { getCurrentUser } from './auth'
import type { EventGuestInsert, EventGuestUpdate } from './types'

// Guest database helpers
export const getEventGuests = async (eventId: string) => {
  return await supabase
    .from('event_guests')
    .select(`
      *,
      user:public_user_profiles(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
}

// Guest lookup by phone for event access
export const findGuestByPhone = async (eventId: string, phone: string) => {
  return await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', eventId)
    .eq('phone', phone)
    .single()
}

// Link guest record to authenticated user account
export const linkGuestToUser = async (eventId: string, phone: string) => {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  return await supabase
    .from('event_guests')
    .update({ user_id: user.id })
    .eq('event_id', eventId)
    .eq('phone', phone)
    .select()
    .single()
}

export const createEventGuest = async (guestData: EventGuestInsert) => {
  return await supabase
    .from('event_guests')
    .insert(guestData)
    .select()
    .single()
}

export const updateEventGuest = async (guestId: string, guestData: EventGuestUpdate) => {
  return await supabase
    .from('event_guests')
    .update(guestData)
    .eq('id', guestId)
    .select()
    .single()
}

// Real-time subscription for guests
export const subscribeToEventGuests = (
  eventId: string,
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Record<string, unknown>
    old: Record<string, unknown>
  }) => void
) => {
  return supabase
    .channel(`event-guests-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_guests',
        filter: `event_id=eq.${eventId}`,
      },
      callback
    )
    .subscribe()
} 