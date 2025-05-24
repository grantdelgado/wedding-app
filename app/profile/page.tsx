'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        setMessage('Error loading profile')
        setIsLoading(false)
        return
      }
      setEmail(user.email || '')
      // Optionally fetch display name from a public profile table if you have one
      // For now, just use user.user_metadata.display_name if present
      setDisplayName(user.user_metadata?.display_name || '')
      setIsLoading(false)
    }
    fetchProfile()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    // Update display name in user_metadata
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } })
    if (error) {
      setMessage('Error updating profile: ' + error.message)
    } else {
      setMessage('Profile updated!')
    }
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.push('/select-event')}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 shadow"
        >
          ← Back
        </button>
      </div>
      <form onSubmit={handleUpdate} className="p-4 max-w-md mx-auto flex-1 pt-16">
        <h2 className="text-xl font-bold mb-4">Your Profile</h2>
        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="border px-4 py-2 w-full rounded mb-4 bg-gray-100 text-gray-500"
        />
        <label className="block mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="border px-4 py-2 w-full rounded mb-4"
          placeholder="Enter your display name"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded w-full disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <p className="mt-2 text-gray-600">{message}</p>}
      </form>
      <div className="p-4 max-w-md mx-auto w-full">
        <LogoutButtonStyled router={router} />
      </div>
    </div>
  )
}

function LogoutButtonStyled({ router }: { router: ReturnType<typeof useRouter> }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700 transition"
    >
      Log Out
    </button>
  );
} 