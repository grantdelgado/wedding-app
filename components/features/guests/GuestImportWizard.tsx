'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface GuestImportWizardProps {
  eventId: string
  onClose: () => void
  onImportComplete: () => void
}

interface GuestEntry {
  fullName: string
  phone: string
  email?: string
  role?: 'host' | 'guest'
  notes?: string
}

export function GuestImportWizard({
  eventId,
  onClose,
  onImportComplete
}: GuestImportWizardProps) {
  const [step, setStep] = useState<'method' | 'manual' | 'csv' | 'processing'>('method')
  const [guests, setGuests] = useState<GuestEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddManualGuest = () => {
    setGuests([...guests, { fullName: '', phone: '', role: 'guest' }])
  }

  const handleUpdateGuest = (index: number, field: keyof GuestEntry, value: string) => {
    const updated = [...guests]
    updated[index] = { ...updated[index], [field]: value }
    setGuests(updated)
  }

  const handleRemoveGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index))
  }

  const handleProcessGuests = useCallback(async () => {
    if (guests.length === 0) return

    setLoading(true)
    setError(null)
    
    try {
      // Process each guest
      for (const guest of guests) {
        if (!guest.fullName.trim() || !guest.phone.trim()) {
          continue // Skip invalid entries
        }

        // Format phone number
        let formattedPhone = guest.phone.trim()
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
        }

        // First, check if user already exists
        const { data: existingUser } = await supabase
          .from('users_new')
          .select('id')
          .eq('phone', formattedPhone)
          .single()

        let userId: string

        if (existingUser) {
          userId = existingUser.id
        } else {
          // Create new user
          const { data: newUser, error: userError } = await supabase
            .from('users_new')
            .insert({
              phone: formattedPhone,
              full_name: guest.fullName.trim(),
              email: guest.email?.trim() || null
            })
            .select('id')
            .single()

          if (userError) {
            console.error('Error creating user:', userError)
            continue
          }

          userId = newUser.id
        }

        // Add as event participant
        const { error: participantError } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: userId,
            role: guest.role || 'guest',
            notes: guest.notes?.trim() || null,
            rsvp_status: 'pending'
          })

        if (participantError) {
          console.error('Error adding participant:', participantError)
        }
      }

      onImportComplete()
    } catch (err) {
      console.error('Error processing guests:', err)
      setError('Failed to import guests. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [guests, eventId, onImportComplete])

  const validateGuest = (guest: GuestEntry): boolean => {
    return guest.fullName.trim().length > 0 && guest.phone.trim().length > 0
  }

  const validGuests = guests.filter(validateGuest)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-3">Processing guests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-xl font-semibold text-stone-800 mb-6">Import Guests</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {step === 'method' && (
        <div className="space-y-4">
          <p className="text-stone-600">How would you like to add guests to your event?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setStep('manual')
                handleAddManualGuest()
              }}
              className="p-6 border-2 border-stone-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-3xl mb-3">✍️</div>
              <div className="font-semibold text-stone-800">Add Manually</div>
              <div className="text-sm text-stone-600">Enter guest details one by one</div>
            </button>

            <button
              onClick={() => setStep('csv')}
              className="p-6 border-2 border-stone-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="text-3xl mb-3">📄</div>
              <div className="font-semibold text-stone-800">Upload CSV</div>
              <div className="text-sm text-stone-600">Import from a spreadsheet</div>
            </button>
          </div>
        </div>
      )}

      {step === 'manual' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-stone-800">Add Guests Manually</h3>
            <Button onClick={handleAddManualGuest} size="sm">
              Add Another
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {guests.map((guest, index) => (
              <div key={index} className="border border-stone-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={guest.fullName}
                      onChange={(e) => handleUpdateGuest(index, 'fullName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={guest.phone}
                      onChange={(e) => handleUpdateGuest(index, 'phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={guest.email || ''}
                      onChange={(e) => handleUpdateGuest(index, 'email', e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Role
                    </label>
                    <select
                      value={guest.role || 'guest'}
                      onChange={(e) => handleUpdateGuest(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="guest">Guest</option>
                      <option value="host">Host</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={guest.notes || ''}
                    onChange={(e) => handleUpdateGuest(index, 'notes', e.target.value)}
                    placeholder="Plus one, dietary restrictions, etc."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleRemoveGuest(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-stone-600">
              {validGuests.length} of {guests.length} guests are valid
            </div>
            <div className="flex space-x-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleProcessGuests}
                disabled={validGuests.length === 0}
              >
                Import {validGuests.length} Guest{validGuests.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'csv' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-stone-800 mb-2">CSV Import</h3>
            <p className="text-stone-600 text-sm mb-4">
              This feature is coming soon. For now, please use the manual import option.
            </p>
            
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <div className="text-sm text-stone-600">
                <p className="mb-2">When available, your CSV should include these columns:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Full Name (required)</li>
                  <li>Phone Number (required)</li>
                  <li>Email (optional)</li>
                  <li>Role (guest/host, optional)</li>
                  <li>Notes (optional)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={() => setStep('method')} variant="outline">
              Back to Options
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 