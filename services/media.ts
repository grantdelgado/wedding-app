import { supabase } from '@/lib/supabase/client'

// Media service functions
export const getEventMedia = async (eventId: string) => {
  return await supabase
    .from('media')
    .select(`
      *,
      uploader:users!media_uploader_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
}

export const uploadMedia = async (mediaData: {
  event_id: string
  storage_path: string
  media_type: 'photo' | 'video'
  uploader_user_id: string
  caption?: string
}) => {
  return await supabase
    .from('media')
    .insert(mediaData)
    .select(`
      *,
      uploader:users!media_uploader_user_id_fkey(*)
    `)
    .single()
}

export const updateMediaCaption = async (id: string, caption: string) => {
  return await supabase
    .from('media')
    .update({ caption })
    .eq('id', id)
    .select()
    .single()
}

export const deleteMedia = async (id: string) => {
  return await supabase
    .from('media')
    .delete()
    .eq('id', id)
}

export const getMediaById = async (id: string) => {
  return await supabase
    .from('media')
    .select(`
      *,
      uploader:users!media_uploader_user_id_fkey(*)
    `)
    .eq('id', id)
    .single()
}

export const getMediaStats = async (eventId: string) => {
  return await supabase
    .from('media')
    .select('media_type, file_size')
    .eq('event_id', eventId)
} 