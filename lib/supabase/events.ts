import { supabase } from './client'
import type { EventInsert, EventUpdate } from './types'

// Database helpers for events
export const createEvent = async (eventData: EventInsert) => {
  return await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()
}

export const updateEvent = async (eventId: string, eventData: EventUpdate) => {
  return await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single()
}

export const getEventWithHost = async (eventId: string) => {
  return await supabase
    .from('events')
    .select(`
      *,
      host:public_user_profiles!events_host_user_id_fkey(*)
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
  const { data, error } = await supabase
    .rpc('is_event_guest', { p_event_id: eventId })
  
  return { isGuest: data, error }
} 