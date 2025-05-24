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
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">🎉 Welcome to Unveil!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Simplify your wedding communication and cherish every moment.
      </p>
      <Link
        href="/login"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
      >
        Login / Sign Up
      </Link>
    </main>
  )
}