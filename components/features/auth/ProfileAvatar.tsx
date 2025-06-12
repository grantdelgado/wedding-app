"use client";

import { useRouter, usePathname } from 'next/navigation';

export default function ProfileAvatar() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Hide profile button on guest event pages and host event pages
  if (pathname.startsWith('/guest/events/') || pathname.startsWith('/host/events/')) {
    return null;
  }
  
  return (
    <button
      onClick={() => router.push('/profile')}
      className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:ring-2 hover:ring-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label="Profile"
    >
      {/* User icon with brand styling */}
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" fill="#6b7280" />
        <ellipse cx="12" cy="17" rx="7" ry="4" fill="#9ca3af" />
      </svg>
    </button>
  );
} 