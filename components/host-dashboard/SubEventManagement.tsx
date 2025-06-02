'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type SubEvent = Database['public']['Tables']['sub_events']['Row']

interface SubEventManagementProps {
  eventId: string
  onSubEventUpdated?: () => void
}

export function SubEventManagement({ eventId, onSubEventUpdated }: SubEventManagementProps) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    is_required: true
  })

  useEffect(() => {
    fetchSubEvents()
  }, [eventId])

  const fetchSubEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order')

      if (error) throw error
      setSubEvents(data || [])
    } catch (error) {
      console.error('Error fetching sub-events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const eventDateTime = formData.event_date && formData.event_time 
        ? `${formData.event_date}T${formData.event_time}:00`
        : null

      const subEventData = {
        event_id: eventId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        event_date: eventDateTime,
        location: formData.location.trim() || null,
        is_required: formData.is_required,
        sort_order: subEvents.length
      }

      let error
      if (editingEvent) {
        const result = await supabase
          .from('sub_events')
          .update(subEventData)
          .eq('id', editingEvent)
        error = result.error
      } else {
        const result = await supabase
          .from('sub_events')
          .insert(subEventData)
        error = result.error
      }

      if (error) throw error

      // Reset form
      setFormData({
        name: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        is_required: true
      })
      setShowAddForm(false)
      setEditingEvent(null)
      
      await fetchSubEvents()
      onSubEventUpdated?.()

    } catch (error) {
      console.error('Error saving sub-event:', error)
    }
  }

  const handleEdit = (subEvent: SubEvent) => {
    const eventDate = subEvent.event_date ? new Date(subEvent.event_date) : null
    
    setFormData({
      name: subEvent.name,
      description: subEvent.description || '',
      event_date: eventDate ? eventDate.toISOString().split('T')[0] : '',
      event_time: eventDate ? eventDate.toTimeString().slice(0, 5) : '',
      location: subEvent.location || '',
      is_required: subEvent.is_required || false
    })
    setEditingEvent(subEvent.id)
    setShowAddForm(true)
  }

  const handleDelete = async (subEventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will remove all guest assignments.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('sub_events')
        .delete()
        .eq('id', subEventId)

      if (error) throw error
      
      await fetchSubEvents()
      onSubEventUpdated?.()
    } catch (error) {
      console.error('Error deleting sub-event:', error)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingEvent(null)
    setFormData({
      name: '',
      description: '',
      event_date: '',
      event_time: '',
      location: '',
      is_required: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800 flex items-center">
            <span className="text-2xl mr-2">🎉</span>
            Event Setup
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            Create different events (Rehearsal, Ceremony, Reception) to organize your guests
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Event
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
          <h3 className="font-medium text-stone-800 mb-4">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Rehearsal Dinner"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                  className="mr-2 rounded text-purple-600 focus:ring-purple-500"
                />
                Required event (all guests will be invited by default)
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <Button type="submit">
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {subEvents.length === 0 ? (
          <div className="text-center py-8 bg-stone-50 rounded-lg">
            <p className="text-stone-500 mb-4">No events created yet</p>
            <p className="text-sm text-stone-400">
              Start by creating events like &quot;Rehearsal Dinner&quot;, &quot;Ceremony&quot;, or &quot;Reception&quot;
            </p>
          </div>
        ) : (
          subEvents.map((subEvent) => (
            <div
              key={subEvent.id}
              className="bg-white border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-stone-800">{subEvent.name}</h3>
                    {subEvent.is_required && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  
                  {subEvent.description && (
                    <p className="text-stone-600 text-sm mt-1">{subEvent.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-stone-500">
                    {subEvent.event_date && (
                      <div className="flex items-center">
                        <span className="mr-1">📅</span>
                        {new Date(subEvent.event_date).toLocaleDateString()} at{' '}
                        {new Date(subEvent.event_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                    {subEvent.location && (
                      <div className="flex items-center">
                        <span className="mr-1">📍</span>
                        {subEvent.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(subEvent)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(subEvent.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {subEvents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Next Steps</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Go to the <strong>Guests</strong> tab to assign guests to specific events</li>
            <li>• Use the <strong>Messages</strong> tab to send event-specific communications</li>
            <li>• Required events will automatically include all guests when messaging</li>
          </ul>
        </div>
      )}
    </div>
  )
} 