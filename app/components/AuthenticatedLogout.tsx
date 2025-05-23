"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LogoutButton from './LogoutButton';

export default function AuthenticatedLogout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);
  if (!isLoggedIn) return null;
  return (
    <div className="absolute top-4 right-4 z-50">
      <LogoutButton />
    </div>
  );
} 