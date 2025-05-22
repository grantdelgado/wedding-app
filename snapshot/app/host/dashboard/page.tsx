// app/host/dashboard/page.tsx
import Link from 'next/link'

export default function HostDashboard() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">👰‍♀️ Host Dashboard</h1>

      {/* Event Creation Section */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Create Your Event</h2>
        <Link
          href="/host/dashboard/create-event"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Event
        </Link>
      </section>

      {/* Placeholder for existing events */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Your Events</h2>
        <p className="text-gray-500">No events yet.</p>
      </section>
    </main>
  )
}