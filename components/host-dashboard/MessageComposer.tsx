'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type SubEvent = Database['public']['Tables']['sub_events']['Row']
type Guest = Database['public']['Tables']['event_guests']['Row']

interface MessageComposerProps {
  eventId: string
  onMessageScheduled?: () => void
}

interface MessagePreview {
  recipientCount: number
  recipients: string[]
}

export function MessageComposer({ eventId, onMessageScheduled }: MessageComposerProps) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<MessagePreview | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    sendNow: true,
    scheduledDate: '',
    scheduledTime: '',
    targetAllGuests: true,
    targetSubEventIds: [] as string[],
    targetGuestTags: [] as string[],
    targetGuestIds: [] as string[],
    sendViaSMS: true,
    sendViaPush: true,
    sendViaEmail: false,
  })

  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchData()
  }, [eventId])

  useEffect(() => {
    if (showPreview) {
      updatePreview()
    }
  }, [formData, showPreview])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch sub-events
      const { data: subEventData, error: subEventError } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order')

      if (subEventError) throw subEventError

      // Fetch guests
      const { data: guestData, error: guestError } = await supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', eventId)

      if (guestError) throw guestError

      setSubEvents(subEventData || [])
      setGuests(guestData || [])

      // Extract unique tags
      const tags = new Set<string>()
      guestData?.forEach(guest => {
        guest.guest_tags?.forEach(tag => tags.add(tag))
      })
      setAvailableTags(Array.from(tags))

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreview = async () => {
    setPreviewLoading(true)
    try {
      let targetedGuests = guests

      if (!formData.targetAllGuests) {
        // Filter guests based on targeting criteria
        targetedGuests = guests.filter(guest => {
          // Check if guest matches any of the selected criteria
          const matchesGuestIds = formData.targetGuestIds.length === 0 || 
                                 formData.targetGuestIds.includes(guest.id)
          
          const matchesTags = formData.targetGuestTags.length === 0 ||
                             formData.targetGuestTags.some(tag => 
                               guest.guest_tags?.includes(tag)
                             )

          // For sub-events, we'd need to check the assignments table
          // For now, including all if no sub-events selected
          const matchesSubEvents = formData.targetSubEventIds.length === 0

          return matchesGuestIds && matchesTags && matchesSubEvents
        })
      }

      setPreview({
        recipientCount: targetedGuests.length,
        recipients: targetedGuests.map(g => g.guest_name || g.guest_email || 'Unnamed Guest').slice(0, 10)
      })
    } catch (error) {
      console.error('Error updating preview:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayInputChange = (field: 'targetSubEventIds' | 'targetGuestTags' | 'targetGuestIds', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) return

    setSending(true)
    try {
      const scheduledAt = formData.sendNow 
        ? new Date().toISOString()
        : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()

      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          event_id: eventId,
          sender_user_id: (await supabase.auth.getUser()).data.user?.id || '',
          subject: formData.subject || null,
          content: formData.content,
          send_at: scheduledAt,
          target_all_guests: formData.targetAllGuests,
          target_sub_event_ids: formData.targetSubEventIds.length > 0 ? formData.targetSubEventIds : null,
          target_guest_tags: formData.targetGuestTags.length > 0 ? formData.targetGuestTags : null,
          target_guest_ids: formData.targetGuestIds.length > 0 ? formData.targetGuestIds : null,
          send_via_sms: formData.sendViaSMS,
          send_via_push: formData.sendViaPush,
          send_via_email: formData.sendViaEmail,
          status: formData.sendNow ? 'scheduled' : 'scheduled'
        })

      if (error) throw error

      // Reset form
      setFormData({
        subject: '',
        content: '',
        sendNow: true,
        scheduledDate: '',
        scheduledTime: '',
        targetAllGuests: true,
        targetSubEventIds: [],
        targetGuestTags: [],
        targetGuestIds: [],
        sendViaSMS: true,
        sendViaPush: true,
        sendViaEmail: false,
      })

      setShowPreview(false)
      onMessageScheduled?.()

    } catch (error) {
      console.error('Error scheduling message:', error)
    } finally {
      setSending(false)
    }
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
      <h2 className="text-xl font-semibold text-stone-800 mb-6 flex items-center">
        <span className="text-2xl mr-2">💬</span>
        Message Guests
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Subject (Optional)
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Message subject..."
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Message Content */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Message Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Write your message to guests..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-stone-500 mt-1">
            {formData.content.length} characters
          </p>
        </div>

        {/* Scheduling */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            When to Send
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="sendTiming"
                checked={formData.sendNow}
                onChange={() => handleInputChange('sendNow', true)}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              Send immediately
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sendTiming"
                checked={!formData.sendNow}
                onChange={() => handleInputChange('sendNow', false)}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              Schedule for later
            </label>
            
            {!formData.sendNow && (
              <div className="ml-6 grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required={!formData.sendNow}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    required={!formData.sendNow}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            Who to Send To
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="targetAudience"
                checked={formData.targetAllGuests}
                onChange={() => handleInputChange('targetAllGuests', true)}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              All guests
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="targetAudience"
                checked={!formData.targetAllGuests}
                onChange={() => handleInputChange('targetAllGuests', false)}
                className="mr-2 text-purple-600 focus:ring-purple-500"
              />
              Specific groups
            </label>

            {!formData.targetAllGuests && (
              <div className="ml-6 space-y-4">
                {/* Sub-events targeting */}
                {subEvents.length > 0 && (
                  <div>
                    <h4 className="font-medium text-stone-700 mb-2">Events</h4>
                    <div className="space-y-2">
                      {subEvents.map(subEvent => (
                        <label key={subEvent.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.targetSubEventIds.includes(subEvent.id)}
                            onChange={(e) => handleArrayInputChange('targetSubEventIds', subEvent.id, e.target.checked)}
                            className="mr-2 rounded text-purple-600 focus:ring-purple-500"
                          />
                          {subEvent.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags targeting */}
                {availableTags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-stone-700 mb-2">Guest Tags</h4>
                    <div className="space-y-2">
                      {availableTags.map(tag => (
                        <label key={tag} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.targetGuestTags.includes(tag)}
                            onChange={(e) => handleArrayInputChange('targetGuestTags', tag, e.target.checked)}
                            className="mr-2 rounded text-purple-600 focus:ring-purple-500"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Channels */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            How to Send
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendViaSMS}
                onChange={(e) => handleInputChange('sendViaSMS', e.target.checked)}
                className="mr-2 rounded text-purple-600 focus:ring-purple-500"
              />
              📱 SMS (recommended)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendViaPush}
                onChange={(e) => handleInputChange('sendViaPush', e.target.checked)}
                className="mr-2 rounded text-purple-600 focus:ring-purple-500"
              />
              🔔 Push notifications (for app users)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendViaEmail}
                onChange={(e) => handleInputChange('sendViaEmail', e.target.checked)}
                className="mr-2 rounded text-purple-600 focus:ring-purple-500"
              />
              📧 Email
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-700">Message Preview</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          {showPreview && (
            <div className="bg-stone-50 rounded-lg p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : preview ? (
                <div>
                  <p className="font-medium text-stone-700 mb-2">
                    This message will be sent to {preview.recipientCount} guest{preview.recipientCount !== 1 ? 's' : ''}
                  </p>
                  {preview.recipients.length > 0 && (
                    <div>
                      <p className="text-sm text-stone-600 mb-1">Recipients include:</p>
                      <p className="text-sm text-stone-500">
                        {preview.recipients.join(', ')}
                        {preview.recipientCount > 10 && ` and ${preview.recipientCount - 10} more...`}
                      </p>
                    </div>
                  )}
                  
                  {formData.content && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-stone-700 mb-1">Message:</p>
                      <p className="text-sm text-stone-600">{formData.content}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {formData.sendNow ? 'Message will be sent immediately' : 'Message will be scheduled'}
            </p>
            <Button
              type="submit"
              disabled={sending || !formData.content.trim()}
              className="min-w-[120px]"
            >
              {sending ? <LoadingSpinner /> : formData.sendNow ? 'Send Now' : 'Schedule Message'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 