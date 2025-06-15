import { supabase } from '@/lib/supabase/client'

// Auth service functions
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

export const signInWithPassword = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signUp = async (email: string, password: string, metadata?: object) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
}

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email)
}

export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({ password })
}

export const sendMagicLink = async (email: string) => {
  return await supabase.auth.signInWithOtp({ email })
}

export const sendSMSOTP = async (phone: string) => {
  return await supabase.auth.signInWithOtp({ phone })
}

export const verifyOTP = async (phone: string, token: string) => {
  return await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
}

export const createDevSession = async (userData: {
  id: string
  phone: string
  name: string
  email?: string
}) => {
  // Development session creation logic
  const password = `dev-${userData.phone.replace(/\D/g, '')}`
  return await signInWithPassword(userData.email || `${userData.phone}@unveil.dev`, password)
}

export const getUserByPhone = async (phone: string) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()
} 