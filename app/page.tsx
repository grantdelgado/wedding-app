'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/select-event')
      } else {
        setLoading(false)
      }
    }
    checkSessionAndRedirect()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Brand Logo/Wordmark */}
        <div className="mb-8">
          <h1 className="text-5xl font-semibold text-stone-800 mb-4 tracking-tight">
            unveil
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto"></div>
        </div>

        {/* Brand Message */}
        <div className="mb-12 space-y-4">
          <p className="text-xl text-stone-700 leading-relaxed">
            Focus on presence, not logistics
          </p>
          <p className="text-stone-600 max-w-lg mx-auto">
            Streamline wedding communication and preserve shared memories in one elegant space.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-flex items-center px-8 py-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Get Started
        </Link>
      </div>
    </main>
  )
}