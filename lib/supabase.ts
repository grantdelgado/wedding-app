// Core client
export { supabase } from './supabase/client'

// Types
export * from './supabase/types'

// Legacy supabase helpers (for backward compatibility during transition)
export * from './supabase/auth'
export * from './supabase/storage'
export * from './supabase/events'
export * from './supabase/guests'
export * from './supabase/messaging'
export * from './supabase/media'

// New services structure (preferred way)
export * as AuthService from '@/services/auth'
export * as EventsService from '@/services/events'
export * as GuestsService from '@/services/guests'
export * as MediaService from '@/services/media'
export * as MessagingService from '@/services/messaging'
export * as StorageService from '@/services/storage'
export * as UsersService from '@/services/users'