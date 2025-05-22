'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthSessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      console.log('🔁 Starting Supabase session check...')

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('📦 Session data:', session)

      if (sessionError) {
        console.error('❌ Error fetching session:', sessionError)
        return
      }

      if (!session?.user) {
        console.warn('⚠️ No user session found')
        return
      }

      const { id, email, user_metadata } = session.user
      const full_name = user_metadata?.full_name || 'Anonymous User'

      console.log('🧠 Upserting user:', { id, email, full_name })

      const { error: upsertError, data } = await supabase
        .from('users')
        .upsert([{ id, email, full_name, role: 'guest' }])
        .select()

      if (upsertError) {
        console.error('🚨 Error inserting/updating user:', JSON.stringify(upsertError, null, 2))
        return
      }

      console.log('✅ User inserted or updated:', data)

      // Redirect after successful insert
      router.push('/select-event')
      return
    }

    init()
  }, [router])

  return <>{children}</>
}
