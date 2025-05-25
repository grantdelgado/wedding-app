'use client'

import { useParams } from 'next/navigation'

export default function EventDashboardPage() {
  const params = useParams()
  const eventId = params.eventId as string

  // TODO: Fetch event details based on eventId

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">🎉 Event Dashboard</h1>
      <p className="text-lg text-gray-700 mb-4">
        Welcome to the dashboard for your event!
      </p>
      <p className="text-md text-gray-600">
        Event ID: <span className="font-mono bg-gray-100 p-1 rounded">{eventId}</span>
      </p>
      <div className="mt-8 p-4 border-l-4 border-blue-500 bg-blue-50">
        <p className="font-semibold text-blue-700">
          This is a placeholder page. You can start building out the specific dashboard features for this event here.
        </p>
        <ul className="list-disc list-inside mt-2 text-blue-600">
          <li>Event Details</li>
          <li>Guest List Management</li>
          <li>Schedule / Itinerary</li>
          <li>Media Gallery</li>
          <li>Messaging Center</li>
        </ul>
      </div>
      {/* Add more dashboard components and functionality here */}
    </main>
  )
} 