'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthSessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      console.log('🔁 Starting Supabase session check...')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      console.log('📦 Session data:', session)

      if (sessionError) {
        console.error('❌ Error fetching session:', sessionError)
        return
      }

      if (!session?.user) {
        console.warn('⚠️ No user session found')
        return
      }

      // ✅ Auth session is valid — but user creation/upsert should be handled elsewhere
      // 🔁 TODO: move user upsert logic to a Supabase trigger or Edge Function

      router.push('/select-event')
      return
    }

    init()
  }, [router])

  return <>{children}</>
}
