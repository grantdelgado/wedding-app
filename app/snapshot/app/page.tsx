  {guests.map((guest) => (
    <li key={guest.id} className="border-b py-2">
      <strong>{guest.full_name}</strong> – {guest.rsvp_status}
      <div className="text-sm text-gray-500">{guest.email} • {guest.tags?.join(', ')}</div>
    </li>
  ))} 