'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Only redirect to login if access token is missing
    if (!searchParams.get('access_token')) {
      router.replace('/login')
    }
  }, [searchParams, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage('Error updating password: ' + error.message)
    } else {
      setMessage('Password updated! You can now log in.')
      setTimeout(() => router.replace('/login'), 2000)
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleUpdate} className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Set a New Password</h2>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="New password"
        className="border px-4 py-2 w-full rounded mb-2"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded w-full disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Password'}
      </button>
      {message && <p className="mt-2 text-gray-600">{message}</p>}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
} 