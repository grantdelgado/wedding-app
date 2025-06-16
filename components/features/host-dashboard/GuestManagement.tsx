'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type Participant = Database['public']['Tables']['event_participants']['Row'] & {
  users_new: {
    id: string
    full_name: string | null
    phone: string
    email: string | null
    avatar_url: string | null
  }
}

interface GuestManagementProps {
  eventId: string
  onGuestUpdated?: () => void
}

export function GuestManagement({ eventId, onGuestUpdated }: GuestManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterByRSVP, setFilterByRSVP] = useState('all')
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select(`
          *,
          users_new (
            id,
            full_name,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('event_id', eventId)

      if (participantError) throw participantError

      setParticipants(participantData || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRSVPUpdate = async (participantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ rsvp_status: newStatus })
        .eq('id', participantId)

      if (error) throw error

      await fetchData()
      onGuestUpdated?.()
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId)

      if (error) throw error

      await fetchData()
      onGuestUpdated?.()
    } catch (error) {
      console.error('Error removing participant:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set())
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map(p => p.id)))
    }
  }

  const handleBulkRSVPUpdate = async (newStatus: string) => {
    if (selectedParticipants.size === 0) return

    try {
      const operations = Array.from(selectedParticipants).map(participantId =>
        supabase
          .from('event_participants')
          .update({ rsvp_status: newStatus })
          .eq('id', participantId)
      )

      await Promise.all(operations)
      await fetchData()
      setSelectedParticipants(new Set())
      onGuestUpdated?.()
    } catch (error) {
      console.error('Error updating RSVPs:', error)
    }
  }

  // Apply filters
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !searchTerm || 
      participant.users_new?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.users_new?.phone?.includes(searchTerm) ||
      participant.users_new?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRSVP = filterByRSVP === 'all' || participant.rsvp_status === filterByRSVP
    
    return matchesSearch && matchesRSVP
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center">
          <span className="text-2xl mr-2">👥</span>
          Participant Management
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          {participants.length} total participants
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <select
            value={filterByRSVP}
            onChange={(e) => setFilterByRSVP(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All RSVP Status</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="maybe">Maybe</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <Button 
            variant="outline" 
            onClick={handleSelectAll}
            className="w-full"
          >
            {selectedParticipants.size === filteredParticipants.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedParticipants.size > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <p className="text-sm text-purple-700 mb-3">
            {selectedParticipants.size} participant{selectedParticipants.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkRSVPUpdate('attending')}
            >
              Mark Attending
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkRSVPUpdate('declined')}
            >
              Mark Declined
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkRSVPUpdate('maybe')}
            >
              Mark Maybe
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkRSVPUpdate('pending')}
            >
              Mark Pending
            </Button>
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="p-6">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤷‍♀️</div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">No participants found</h3>
            <p className="text-stone-500">
              {participants.length === 0 
                ? "No participants have been added yet."
                : "Try adjusting your search or filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map(participant => (
              <div key={participant.id} className="border border-stone-200 rounded-lg p-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(participant.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedParticipants)
                      if (e.target.checked) {
                        newSelected.add(participant.id)
                      } else {
                        newSelected.delete(participant.id)
                      }
                      setSelectedParticipants(newSelected)
                    }}
                    className="mt-1 mr-3 rounded text-purple-600 focus:ring-purple-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-stone-800">
                          {participant.users_new?.full_name || 'Unnamed Participant'}
                        </h3>
                        <div className="text-sm text-stone-600 space-y-1">
                          {participant.users_new?.email && (
                            <div>📧 {participant.users_new.email}</div>
                          )}
                          {participant.users_new?.phone && (
                            <div>📱 {participant.users_new.phone}</div>
                          )}
                          <div>👤 {participant.role}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          participant.rsvp_status === 'attending' ? 'bg-green-100 text-green-800' :
                          participant.rsvp_status === 'declined' ? 'bg-red-100 text-red-800' :
                          participant.rsvp_status === 'maybe' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-800'
                        }`}>
                          {participant.rsvp_status || 'Pending'}
                        </div>
                      </div>
                    </div>

                    {participant.notes && (
                      <div className="mt-2 text-sm text-stone-600 bg-stone-50 rounded p-2">
                        💭 {participant.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <select
                          value={participant.rsvp_status || 'pending'}
                          onChange={(e) => handleRSVPUpdate(participant.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="attending">Attending</option>
                          <option value="declined">Declined</option>
                          <option value="maybe">Maybe</option>
                        </select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {participants.length > 0 && (
        <div className="p-6 border-t border-stone-100 bg-stone-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {participants.filter(p => p.rsvp_status === 'attending').length}
              </div>
              <div className="text-xs text-stone-600">Attending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {participants.filter(p => p.rsvp_status === 'declined').length}
              </div>
              <div className="text-xs text-stone-600">Declined</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {participants.filter(p => p.rsvp_status === 'maybe').length}
              </div>
              <div className="text-xs text-stone-600">Maybe</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-600">
                {participants.filter(p => !p.rsvp_status || p.rsvp_status === 'pending').length}
              </div>
              <div className="text-xs text-stone-600">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 