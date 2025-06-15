import { supabase } from '@/lib/supabase/client'
import type { EventInsert, EventUpdate } from '@/lib/supabase/types'

// Event service functions
export const createEvent = async (eventData: EventInsert) => {
  return await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()
}

export const updateEvent = async (id: string, updates: EventUpdate) => {
  return await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const deleteEvent = async (id: string) => {
  return await supabase
    .from('events')
    .delete()
    .eq('id', id)
}

export const getEventById = async (id: string) => {
  return await supabase
    .from('events')
    .select(`
      *,
      host:users!events_host_id_fkey(*)
    `)
    .eq('id', id)
    .single()
}

export const getHostEvents = async (hostId: string) => {
  return await supabase
    .from('events')
    .select('*')
    .eq('host_id', hostId)
    .order('event_date', { ascending: true })
}

export const getGuestEvents = async (userId: string) => {
  return await supabase
    .from('event_guests')
    .select(`
      *,
      event:events(
        *,
        host:users!events_host_id_fkey(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const getEventGuests = async (eventId: string) => {
  return await supabase
    .from('event_guests')
    .select(`
      *,
      user:users(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
}

export const addGuestToEvent = async (eventId: string, phone: string, userId?: string) => {
  return await supabase
    .from('event_guests')
    .insert({
      event_id: eventId,
      phone: phone,
      user_id: userId || null,
      rsvp_status: 'pending'
    })
    .select()
    .single()
}

export const updateGuestRSVP = async (eventId: string, userId: string, status: string) => {
  return await supabase
    .from('event_guests')
    .update({ rsvp_status: status })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single()
}

export const removeGuestFromEvent = async (eventId: string, userId: string) => {
  return await supabase
    .from('event_guests')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
} 