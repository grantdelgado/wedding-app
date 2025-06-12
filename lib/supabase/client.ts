import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/app/reference/supabase.types'

// Create typed Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) 