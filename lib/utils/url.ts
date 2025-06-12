// URL utilities
export const getSupabaseFileUrl = (bucket: string, path: string): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
} 