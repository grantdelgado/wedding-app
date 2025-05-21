'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthSessionWatcher({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      console.log('🔁 Starting Supabase session check...')

      // 1) Get current session
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

      // 2) Upsert the user record
      const { id, email, user_metadata } = session.user
      const full_name = user_metadata?.full_name || 'Anonymous User'
      console.log('🧠 Supabase UID:', id)
      console.log('📧 Email:', email)
      console.log('🙋 Full name:', full_name)

      const { error: upsertError } = await supabase
        .from('users')
        .upsert([{ id, email, full_name, role: 'guest' }])

      if (upsertError) {
        console.error(
          '🚨 Error inserting/updating user:',
          JSON.stringify(upsertError, null, 2)
        )
        return
      }
      console.log('✅ User inserted or updated')

      // 3) Fetch their role and redirect
      const {
        data: userRecord,
        error: userFetchError,
      } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single()

      if (userFetchError) {
        console.error('❌ Error fetching user role:', userFetchError)
        return
      }
      console.log('✅ User role:', userRecord?.role)

      if (userRecord?.role === 'host') {
        router.push('/host/dashboard')
      } else {
        router.push('/guest/home')
      }
    }

    init()
  }, [router])

  return <>{children}</>
}