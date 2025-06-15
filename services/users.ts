import { supabase } from '@/lib/supabase/client'

// User service functions
export const getUserById = async (id: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
}

export const getUserByPhone = async (phone: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()
}

export const getUserByEmail = async (email: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
}

export const createUser = async (userData: {
  name: string
  phone: string
  email?: string
  avatar_url?: string
}) => {
  return await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
}

export const updateUser = async (id: string, updates: {
  name?: string
  phone?: string
  email?: string
  avatar_url?: string
}) => {
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const deleteUser = async (id: string) => {
  return await supabase
    .from('users')
    .delete()
    .eq('id', id)
}

export const searchUsers = async (query: string, limit: number = 10) => {
  return await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit)
}

export const getUsersWithRoles = async (eventId: string) => {
  return await supabase
    .from('event_guests')
    .select(`
      *,
      user:users(*)
    `)
    .eq('event_id', eventId)
}

export interface UserProfile {
  id: string
  name: string
  phone: string
  email?: string
  avatar_url?: string
  created_at: string
  updated_at: string
} 