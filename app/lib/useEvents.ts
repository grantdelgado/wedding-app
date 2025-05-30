import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/app/reference/supabase.types';

type GuestWithEvent = Database['public']['Tables']['event_guests']['Row'] & {
  events: Database['public']['Tables']['events']['Row'] | null;
};

export function useEvents(userId: string | null) {
  const [hostedEvents, setHostedEvents] = useState<Database['public']['Tables']['events']['Row'][]>([]);
  const [guestEvents, setGuestEvents] = useState<Database['public']['Tables']['events']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    async function fetchEvents() {
      // Hosted events
      const { data: hostData, error: hostError } = await supabase
        .from('events')
        .select('*')
        .eq('host_user_id', userId);
      if (hostError) setError(hostError.message);
      setHostedEvents(hostData || []);

      // Guest events
      const { data: guestData, error: guestError } = await supabase
        .from('event_guests')
        .select('*, events:events(*)')
        .eq('user_id', userId);
      if (guestError) setError(guestError.message);
      const formatted = ((guestData as GuestWithEvent[]) || [])
        .map(g => g.events)
        .filter((e): e is Database['public']['Tables']['events']['Row'] => e !== null);
      setGuestEvents(formatted);
      setLoading(false);
    }
    fetchEvents();
  }, [userId]);

  return { hostedEvents, guestEvents, loading, error };
} 