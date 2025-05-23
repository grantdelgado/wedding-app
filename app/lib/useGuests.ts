import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/reference/supabase.types';

export function useGuests(eventId: string | null) {
  const [guests, setGuests] = useState<Database['public']['Tables']['guests']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    async function fetchGuests() {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId);
      if (error) setError(error.message);
      setGuests(data || []);
      setLoading(false);
    }
    fetchGuests();
  }, [eventId]);

  return { guests, loading, error };
} 