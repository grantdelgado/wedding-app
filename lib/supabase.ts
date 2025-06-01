import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/app/reference/supabase.types'

// Create typed Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types for convenience
export type Event = Tables<'events'>
export type EventGuest = Tables<'event_guests'>
export type Message = Tables<'messages'>
export type Media = Tables<'media'>
export type User = Tables<'users'>
export type PublicUserProfile = Database['public']['Views']['public_user_profiles']['Row']

// Insert types
export type EventInsert = TablesInsert<'events'>
export type EventGuestInsert = TablesInsert<'event_guests'>
export type MessageInsert = TablesInsert<'messages'>
export type MediaInsert = TablesInsert<'media'>
export type UserInsert = TablesInsert<'users'>

// Update types
export type EventUpdate = TablesUpdate<'events'>
export type EventGuestUpdate = TablesUpdate<'event_guests'>
export type MessageUpdate = TablesUpdate<'messages'>
export type MediaUpdate = TablesUpdate<'media'>
export type UserUpdate = TablesUpdate<'users'>

// Enum types
export type MessageType = Enums<'message_type_enum'>
export type MediaType = Enums<'media_type_enum'>
export type UserRole = Enums<'user_role_enum'>

// Extended types with relations
export interface EventWithHost extends Event {
  host: PublicUserProfile | null
}

export interface EventGuestWithUser extends EventGuest {
  user: PublicUserProfile | null
}

export interface EventGuestWithEvent extends EventGuest {
  events: Event | null
}

export interface MessageWithSender extends Message {
  sender: PublicUserProfile | null
}

export interface MediaWithUploader extends Media {
  uploader: PublicUserProfile | null
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  return await supabase.storage
    .from(bucket)
    .upload(path, file, options)
}

export const getPublicUrl = (bucket: string, path: string) => {
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path)
}

export const deleteFile = async (bucket: string, path: string) => {
  return await supabase.storage
    .from(bucket)
    .remove([path])
}

// Database helpers with better error handling
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

export const getEventMessages = async (eventId: string) => {
  return await supabase
    .from('messages')
    .select(`
      *,
      sender:public_user_profiles!messages_sender_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
}

export const createMessage = async (messageData: MessageInsert) => {
  return await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()
}

export const getEventMedia = async (eventId: string) => {
  return await supabase
    .from('media')
    .select(`
      *,
      uploader:public_user_profiles!media_uploader_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
}

export const createMedia = async (mediaData: MediaInsert) => {
  return await supabase
    .from('media')
    .insert(mediaData)
    .select()
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

// Real-time helpers
export const subscribeToEventMessages = (
  eventId: string,
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Record<string, unknown>
    old: Record<string, unknown>
  }) => void
) => {
  return supabase
    .channel(`event-messages-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToEventMedia = (
  eventId: string,
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Record<string, unknown>
    old: Record<string, unknown>
  }) => void
) => {
  return supabase
    .channel(`event-media-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'media',
        filter: `event_id=eq.${eventId}`,
      },
      callback
    )
    .subscribe()
}

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