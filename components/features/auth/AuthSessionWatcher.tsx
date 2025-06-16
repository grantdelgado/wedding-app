'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthSessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth handling for specific routes that don't require redirects
    const skipAuthRoutes = [
      '/reset-password',
      '/login',
      '/profile',
      '/select-event',
      // Allow all host and guest routes through (they'll handle their own auth)
      '/host/',
      '/guest/'
    ]

    const shouldSkipAuth = skipAuthRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    )

    if (shouldSkipAuth) return

    const init = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Error fetching session:', sessionError)
          return
        }

        if (!session?.user) {
          // No session - redirect to login unless already there
          if (pathname !== '/login') {
            router.push('/login')
          }
          return
        }

        // User is authenticated - ensure they have a profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users_new')
          .select('id, phone, full_name')
          .eq('id', session.user.id)
          .single()

        if (profileError || !userProfile) {
          console.log('User profile not found, will be created by trigger or needs manual creation')
          // The database trigger should handle profile creation
          // If it doesn't exist, it will be created on first profile access
        }

        // Redirect authenticated users to event selection page
        // This allows them to choose which event to access and see their role per event
        if (pathname === '/' || pathname === '/login') {
          router.push('/select-event')
        }

      } catch (error) {
        console.error('Unexpected error in auth session watcher:', error)
      }
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // User just signed in - redirect to event selection
          router.push('/select-event')
        } else if (event === 'SIGNED_OUT') {
          // User signed out - redirect to login
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname])

  return <>{children}</>
}
