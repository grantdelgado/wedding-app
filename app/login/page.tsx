'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setMessage('Error logging in: ' + error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Log in</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="border px-4 py-2 w-full rounded mb-2"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded w-full disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </button>
      {message && <p className="mt-2 text-gray-600">{message}</p>}
    </form>
  )
}
