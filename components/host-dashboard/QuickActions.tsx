'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SMSAnnouncementModal } from './SMSAnnouncementModal'

interface QuickActionsProps {
  eventId: string
  guestCount: number
  pendingRSVPs: number
  onActionComplete?: () => void
}

export function QuickActions({ 
  eventId, 
  guestCount, 
  pendingRSVPs, 
  onActionComplete 
}: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)

  const actions = [
    {
      id: 'send-reminder',
      title: 'Send RSVP Reminder',
      description: `Remind ${pendingRSVPs} guests to respond`,
      icon: '📨',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
      textColor: 'text-amber-800',
      disabled: pendingRSVPs === 0,
      onClick: () => handleSendRSVPReminder()
    },
    {
      id: 'import-guests',
      title: 'Import More Guests',
      description: 'Upload a spreadsheet with guest details',
      icon: '📋',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      textColor: 'text-blue-800',
      disabled: false,
      onClick: () => handleImportGuests()
    },
    {
      id: 'send-announcement',
      title: 'Send Announcement',
      description: `Broadcast message to all ${guestCount} guests`,
      icon: '📢',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      textColor: 'text-purple-800',
      disabled: guestCount === 0,
      onClick: () => handleSendAnnouncement()
    },
    {
      id: 'manage-schedule',
      title: 'Manage Schedule',
      description: 'Add ceremony, reception, dinner times',
      icon: '🗓️',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      textColor: 'text-emerald-800',
      disabled: false,
      onClick: () => handleManageSchedule()
    },
    {
      id: 'download-list',
      title: 'Download Guest List',
      description: 'Export current RSVPs and contact info',
      icon: '📥',
      color: 'bg-stone-50 border-stone-200 hover:bg-stone-100',
      textColor: 'text-stone-800',
      disabled: guestCount === 0,
      onClick: () => handleDownloadGuestList()
    },
    {
      id: 'view-photos',
      title: 'View All Photos',
      description: 'See all shared wedding memories',
      icon: '📸',
      color: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
      textColor: 'text-rose-800',
      disabled: false,
      onClick: () => handleViewPhotos()
    }
  ]

  const handleSendRSVPReminder = async () => {
    setIsLoading('send-reminder')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Send SMS reminders via API
      const response = await fetch('/api/sms/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          eventId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reminders')
      }

      // Show success message with details
      const message = result.sent > 0 
        ? `📱 Successfully sent SMS reminders to ${result.sent} guests!${result.failed > 0 ? ` (${result.failed} failed)` : ''}`
        : '📱 No eligible guests found for SMS reminders. Make sure guests have phone numbers and haven&apos;t opted out.'

      alert(message)
      onActionComplete?.()
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert(`Failed to send SMS reminders: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(null)
    }
  }

  const handleImportGuests = () => {
    // This would trigger opening the import wizard
    // For now, we'll show a simple alert
    alert('Import guests functionality - this would open the guest import wizard')
    onActionComplete?.()
  }

  const handleSendAnnouncement = () => {
    setShowAnnouncementModal(true)
  }

  const handleManageSchedule = () => {
    // This would open the sub-events management
    alert('Manage schedule functionality - this would open sub-events management')
    onActionComplete?.()
  }

  const handleDownloadGuestList = async () => {
    setIsLoading('download-list')
    try {
      // Fetch guest data
      const { data: guests, error } = await supabase
        .from('event_guests')
        .select('guest_name, guest_email, phone, rsvp_status, notes')
        .eq('event_id', eventId)
        .order('guest_name')

      if (error) throw error

      // Create CSV content
      const csvHeaders = ['Name', 'Email', 'Phone', 'RSVP Status', 'Notes']
      const csvRows = guests?.map(guest => [
        guest.guest_name || '',
        guest.guest_email || '',
        guest.phone || '',
        guest.rsvp_status || 'Pending',
        guest.notes || ''
      ]) || []

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `guest-list-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      onActionComplete?.()
    } catch (error) {
      console.error('Error downloading guest list:', error)
      alert('Failed to download guest list. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleViewPhotos = () => {
    // This would navigate to a photos page or open a modal
    alert('View photos functionality - this would show all wedding photos')
    onActionComplete?.()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Quick Actions
        </h2>
        <div className="text-sm text-stone-500">
          Common tasks for your wedding
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled || isLoading === action.id}
            className={`
              relative p-4 border rounded-xl text-left transition-all duration-200 transform hover:scale-105 active:scale-95
              ${action.color}
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isLoading === action.id ? 'opacity-75' : ''}
            `}
          >
            {isLoading === action.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="text-2xl flex-shrink-0 mt-1">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${action.textColor}`}>
                  {action.title}
                </div>
                <div className={`text-xs mt-1 ${action.textColor} opacity-80`}>
                  {action.description}
                </div>
              </div>
            </div>

            {action.disabled && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-stone-400 rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Additional helpful tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="text-lg">💡</div>
          <div>
            <div className="text-sm font-medium text-stone-800 mb-1">
              Pro Tips for Wedding Success
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <div>• Send RSVP reminders 2-3 weeks before your event</div>
              <div>• Keep guests engaged with regular updates and photos</div>
              <div>• Download your guest list backup before the big day</div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Announcement Modal */}
      <SMSAnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        eventId={eventId}
        guestCount={guestCount}
        onSuccess={() => {
          onActionComplete?.()
        }}
      />
    </div>
  )
}