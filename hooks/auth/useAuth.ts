import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser, getCurrentSession, signOut } from '@/services/auth'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'
import type { User, Session } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  error: AppError | null
  signOut: () => Promise<{ error: AppError | null }>
  refetchUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchAuthState = useCallback(async () => {
    const wrappedFetch = withErrorHandling(async () => {
      setLoading(true)
      setError(null)

      const [userResult, sessionResult] = await Promise.all([
        getCurrentUser(),
        getCurrentSession()
      ])

      if (userResult.error) {
        throw userResult.error
      }

      if (sessionResult.error) {
        throw sessionResult.error
      }

      setUser(userResult.user)
      setSession(sessionResult.session)
      setLoading(false)
    }, 'useAuth.fetchAuthState')

    const result = await wrappedFetch()
    if (result?.error) {
      setError(result.error)
      logError(result.error, 'useAuth.fetchAuthState')
      setLoading(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    const wrappedSignOut = withErrorHandling(async () => {
      const { error } = await signOut()
      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
      return { error: null }
    }, 'useAuth.signOut')

    const result = await wrappedSignOut()
    if (result?.error) {
      logError(result.error, 'useAuth.signOut')
      return { error: result.error }
    }
    return { error: null }
  }, [])

  const refetchUser = useCallback(async () => {
    await fetchAuthState()
  }, [fetchAuthState])

  useEffect(() => {
    fetchAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchAuthState])

  return {
    user,
    session,
    loading,
    error,
    signOut: handleSignOut,
    refetchUser,
  }
} 