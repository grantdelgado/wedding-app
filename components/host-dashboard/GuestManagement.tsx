'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type Guest = Database['public']['Tables']['event_guests']['Row']
type SubEvent = Database['public']['Tables']['sub_events']['Row']
type GuestAssignment = Database['public']['Tables']['guest_sub_event_assignments']['Row']

interface GuestWithAssignments extends Guest {
  sub_event_assignments: (GuestAssignment & { sub_events: SubEvent })[]
}

interface GuestManagementProps {
  eventId: string
  onGuestUpdated?: () => void
}

export function GuestManagement({ eventId, onGuestUpdated }: GuestManagementProps) {
  const [guests, setGuests] = useState<GuestWithAssignments[]>([])
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set())
  const [editingGuest, setEditingGuest] = useState<string | null>(null)
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBySubEvent, setFilterBySubEvent] = useState<string>('all')
  const [filterByRSVP, setFilterByRSVP] = useState<string>('all')

  // Load guests and sub-events
  useEffect(() => {
    fetchData()
  }, [eventId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch guests with sub-event assignments
      const { data: guestData, error: guestError } = await supabase
        .from('event_guests')
        .select(`
          *,
          guest_sub_event_assignments!inner (
            *,
            sub_events (*)
          )
        `)
        .eq('event_id', eventId)
        .order('guest_name')

      if (guestError) throw guestError

      // Fetch sub-events separately for the dropdown
      const { data: subEventData, error: subEventError } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order')

      if (subEventError) throw subEventError

      setGuests(guestData || [])
      setSubEvents(subEventData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter guests based on search and filters
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone?.includes(searchTerm)

    const matchesSubEvent = filterBySubEvent === 'all' || 
                           guest.sub_event_assignments.some(assignment => 
                             assignment.sub_event_id === filterBySubEvent
                           )

    const matchesRSVP = filterByRSVP === 'all' || guest.rsvp_status === filterByRSVP

    return matchesSearch && matchesSubEvent && matchesRSVP
  })

  // Handle bulk operations
  const handleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set())
    } else {
      setSelectedGuests(new Set(filteredGuests.map(g => g.id)))
    }
  }

  const handleSelectGuest = (guestId: string) => {
    const newSelected = new Set(selectedGuests)
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId)
    } else {
      newSelected.add(guestId)
    }
    setSelectedGuests(newSelected)
  }

  const handleBulkSubEventAssignment = async (subEventId: string, assign: boolean) => {
    if (selectedGuests.size === 0) return

    try {
      const operations = Array.from(selectedGuests).map(guestId => {
        if (assign) {
          return supabase
            .from('guest_sub_event_assignments')
            .upsert({
              guest_id: guestId,
              sub_event_id: subEventId,
              is_invited: true
            })
        } else {
          return supabase
            .from('guest_sub_event_assignments')
            .delete()
            .match({ guest_id: guestId, sub_event_id: subEventId })
        }
      })

      await Promise.all(operations)
      await fetchData()
      setSelectedGuests(new Set())
      onGuestUpdated?.()
    } catch (error) {
      console.error('Error updating sub-event assignments:', error)
    }
  }

  const getGuestSubEvents = (guest: GuestWithAssignments): string[] => {
    return guest.sub_event_assignments
      .filter(assignment => assignment.is_invited)
      .map(assignment => assignment.sub_events?.name || 'Unknown')
  }

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
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center">
          <span className="text-2xl mr-2">👥</span>
          Guest Management
        </h2>
        <Button onClick={() => setShowAddGuest(true)}>
          Add Guest
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <select
            value={filterBySubEvent}
            onChange={(e) => setFilterBySubEvent(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            {subEvents.map(subEvent => (
              <option key={subEvent.id} value={subEvent.id}>
                {subEvent.name}
              </option>
            ))}
          </select>
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
            {selectedGuests.size === filteredGuests.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGuests.size > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-700 mb-3">
            {selectedGuests.size} guest{selectedGuests.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {subEvents.map(subEvent => (
              <div key={subEvent.id} className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkSubEventAssignment(subEvent.id, true)}
                >
                  Add to {subEvent.name}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkSubEventAssignment(subEvent.id, false)}
                >
                  Remove from {subEvent.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest List */}
      <div className="space-y-2">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            {guests.length === 0 ? 'No guests added yet' : 'No guests match your filters'}
          </div>
        ) : (
          filteredGuests.map(guest => (
            <div
              key={guest.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedGuests.has(guest.id) 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedGuests.has(guest.id)}
                    onChange={() => handleSelectGuest(guest.id)}
                    className="rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-stone-800">
                          {guest.guest_name || 'Unnamed Guest'}
                        </h3>
                        <div className="text-sm text-stone-600 space-y-1">
                          {guest.guest_email && (
                            <div>📧 {guest.guest_email}</div>
                          )}
                          {guest.phone && (
                            <div>📱 {guest.phone}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          guest.rsvp_status === 'attending' ? 'bg-green-100 text-green-800' :
                          guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-800' :
                          guest.rsvp_status === 'maybe' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-800'
                        }`}>
                          {guest.rsvp_status || 'Pending'}
                        </div>
                      </div>
                    </div>

                    {/* Sub-event assignments */}
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {getGuestSubEvents(guest).map((eventName, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {eventName}
                          </span>
                        ))}
                        {getGuestSubEvents(guest).length === 0 && (
                          <span className="text-xs text-stone-400">No events assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Guest tags */}
                    {guest.guest_tags && guest.guest_tags.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {guest.guest_tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingGuest(guest.id)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-stone-50 rounded-lg">
          <div className="text-2xl font-bold text-stone-800">{guests.length}</div>
          <div className="text-sm text-stone-600">Total Guests</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {guests.filter(g => g.rsvp_status === 'attending').length}
          </div>
          <div className="text-sm text-green-800">Attending</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">
            {guests.filter(g => g.rsvp_status === 'maybe').length}
          </div>
          <div className="text-sm text-amber-800">Maybe</div>
        </div>
        <div className="text-center p-3 bg-stone-50 rounded-lg">
          <div className="text-2xl font-bold text-stone-600">
            {guests.filter(g => !g.rsvp_status || g.rsvp_status === 'pending').length}
          </div>
          <div className="text-sm text-stone-600">Pending</div>
        </div>
      </div>
    </div>
  )
} 