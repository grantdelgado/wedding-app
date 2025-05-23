"use client";

import { useRouter } from 'next/navigation';

export default function ProfileAvatar() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/profile')}
      className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-black transition"
      aria-label="Profile"
    >
      {/* Default user icon (SVG) */}
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" fill="#888" />
        <ellipse cx="12" cy="17" rx="7" ry="4" fill="#bbb" />
      </svg>
    </button>
  );
} 