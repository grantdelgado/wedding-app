import { supabase } from '@/lib/supabase/client'

// Guest service functions
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

export const getGuestByPhone = async (phone: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()
}

export const createGuest = async (guestData: {
  name: string
  phone: string
  email?: string
}) => {
  return await supabase
    .from('users')
    .insert(guestData)
    .select()
    .single()
}

export const updateGuest = async (id: string, updates: {
  name?: string
  phone?: string
  email?: string
}) => {
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const deleteGuest = async (id: string) => {
  return await supabase
    .from('users')
    .delete()
    .eq('id', id)
}

export const importGuests = async (eventId: string, guests: Array<{
  name: string
  phone: string
  email?: string
  plusOnes?: number
}>) => {
  // First, create or find users
  const userResults = []
  
  for (const guest of guests) {
    // Try to find existing user by phone
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', guest.phone)
      .single()
    
    if (existingUser) {
      userResults.push(existingUser)
    } else {
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: guest.name,
          phone: guest.phone,
          email: guest.email
        })
        .select()
        .single()
      
      if (error) throw error
      userResults.push(newUser)
    }
  }
  
  // Then, add them to the event
  const eventGuestInserts = userResults.map((user, index) => ({
    event_id: eventId,
    phone: guests[index].phone,
    guest_name: guests[index].name,
    guest_email: guests[index].email || null,
    user_id: user.id,
    rsvp_status: 'pending'
  }))
  
  return await supabase
    .from('event_guests')
    .insert(eventGuestInserts)
    .select(`
      *,
      user:users(*)
    `)
}

export const updateGuestRSVP = async (eventId: string, userId: string, status: 'pending' | 'confirmed' | 'declined') => {
  return await supabase
    .from('event_guests')
    .update({ rsvp_status: status })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single()
} 