// app/guest/home/page.tsx
export default function GuestHome() {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">🎉 Guest Home</h1>
  
        {/* RSVP Section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">RSVP</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            RSVP Now
          </button>
        </section>
  
        {/* Upload Media Section */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Share Memories</h2>
          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            Upload a Photo/Video
          </button>
        </section>
      </main>
    )
  }  