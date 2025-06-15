'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthSessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if NOT on /reset-password (with or without query params), /login, or /profile
    // or any paths under /host (which are for authenticated hosts)
    // or any paths under /guest (which are for authenticated guests)
    // or on /select-event (which is the target page)
    if (
      pathname.startsWith('/reset-password') ||
      pathname === '/login' ||
      pathname === '/profile' ||
      pathname === '/select-event' ||
      pathname.startsWith('/host/') ||
      pathname.startsWith('/guest/')
    ) return;

    const init = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ Error fetching session:', sessionError)
        return
      }

      if (!session?.user) {
        return
      }

      // ✅ Auth session is valid — user creation/upsert is now handled by a Supabase trigger or Edge Function

      router.push('/select-event')
    }

    init()
  }, [router, pathname])

  return <>{children}</>
}
