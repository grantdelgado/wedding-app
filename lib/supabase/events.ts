import { supabase } from './client'
import type { EventInsert, EventUpdate } from './types'

// Database helpers for events
export const createEvent = async (eventData: EventInsert) => {
  return await supabase
    .from('events_new')
    .insert(eventData)
    .select()
    .single()
}

export const updateEvent = async (eventId: string, eventData: EventUpdate) => {
  return await supabase
    .from('events_new')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single()
}

export const getEventWithHost = async (eventId: string) => {
  return await supabase
    .from('events_new')
    .select(`
      *,
      host:users_new!events_new_host_user_id_fkey(*)
    `)
    .eq('id', eventId)
    .single()
}

// Permission helpers
export const isEventHost = async (eventId: string) => {
  const { data, error } = await supabase
    .rpc('is_event_host', { p_event_id: eventId })
  
  return { isHost: data, error }
}

export const isEventGuest = async (eventId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isGuest: false, error: null }
  
  const { data, error } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .eq('role', 'guest')
    .single()
  
  return { isGuest: !!data, error }
} 