"use client";

import { supabase } from '@/lib/supabase';

export default function LogoutButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; // Redirect to login page after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
    >
      Log Out
    </button>
  );
} 