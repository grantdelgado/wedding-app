'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasHostedEvents, setHasHostedEvents] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        setMessage('Something went wrong loading your profile')
        setIsLoading(false)
        return
      }
      setEmail(user.email || '')
      setDisplayName(user.user_metadata?.display_name || '')
      
      // Check if user has hosted events
      const { data: hostedEvents } = await supabase
        .from('events')
        .select('id')
        .eq('host_user_id', user.id)
      
      setHasHostedEvents((hostedEvents?.length || 0) > 0)
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
      setMessage('Something went wrong. Please try again.')
    } else {
      setMessage('Profile updated successfully')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/select-event')}
            className="flex items-center text-stone-600 hover:text-stone-800 font-medium transition-colors"
          >
            <span className="text-xl mr-2">←</span>
            Back to Events
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-rose-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <ellipse cx="12" cy="17" rx="7" ry="4" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-stone-800 mb-2">Your Profile</h1>
            <p className="text-stone-600">Manage your account settings and preferences</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-stone-50 text-stone-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                placeholder="Enter your display name"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-center text-sm ${
                message.includes('wrong') 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Wedding Hub Actions */}
        {hasHostedEvents && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-stone-800 mb-2">Wedding Management</h2>
              <p className="text-stone-600 mb-6">Create additional wedding hubs or manage existing ones</p>
              
              <Link
                href="/host/events/create"
                className="inline-flex items-center justify-center px-6 py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200"
              >
                Create Another Wedding Hub
              </Link>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          <h2 className="text-xl font-medium text-stone-800 mb-6">Account Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/select-event')}
              className="w-full py-3 px-4 bg-stone-50 text-stone-700 font-medium rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              View All Events
            </button>
            
            <LogoutButtonStyled router={router} />
          </div>
        </div>
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
      className="w-full py-3 px-4 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
    >
      Log Out
    </button>
  );
}