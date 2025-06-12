import type { Database } from '@/app/reference/supabase.types'

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