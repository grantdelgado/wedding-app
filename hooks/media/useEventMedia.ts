import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  type Media,
  type MediaInsert,
  type MediaWithUploader 
} from '@/lib/supabase/types'
import { getEventMedia, uploadMedia as uploadMediaService } from '@/services/media'
import { subscribeToEventMedia } from '@/lib/supabase/media'
import { logError, type AppError } from '@/lib/error-handling'
import { withErrorHandling } from '@/lib/error-handling'

interface UseEventMediaReturn {
  media: MediaWithUploader[]
  loading: boolean
  error: AppError | null
  uploadMedia: (mediaData: {
    event_id: string
    storage_path: string
    media_type: 'photo' | 'video'
    uploader_user_id: string
    caption?: string
  }) => Promise<{ success: boolean; error: string | null }>
  refetch: () => Promise<void>
}

export function useEventMedia(eventId: string | null): UseEventMediaReturn {
  const [media, setMedia] = useState<MediaWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchMedia = useCallback(async () => {
    if (!eventId) {
      setMedia([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('⚠️ No authenticated user for media')
        setMedia([])
        setLoading(false)
        return
      }

      const { data, error: mediaError } = await getEventMedia(eventId)

      if (mediaError) {
        // Handle permission errors gracefully
        if (mediaError.code === 'PGRST301' || mediaError.message?.includes('permission')) {
          console.warn('⚠️ No permission to access media for this event')
          setMedia([])
          setLoading(false)
          return
        }
        throw new Error(mediaError.message || 'Failed to fetch media')
      }

      // Map the data to match MediaWithUploader type
      const mappedData = (data || []).map(item => ({
        ...item,
        uploader: item.uploader || null
      })) as MediaWithUploader[]
      setMedia(mappedData)
      setLoading(false)
    } catch (err) {
      console.warn('⚠️ useEventMedia fetchMedia error:', err)
      setMedia([])
      setLoading(false)
    }
  }, [eventId])

  const uploadMedia = useCallback(async (mediaData: {
    event_id: string
    storage_path: string
    media_type: 'photo' | 'video'
    uploader_user_id: string
    caption?: string
  }) => {
    const wrappedUpload = withErrorHandling(async () => {
      const { data, error } = await uploadMediaService(mediaData)

      if (error) {
        throw new Error('Failed to upload media')
      }

      // Refresh media list after successful upload
      await fetchMedia()
      return { success: true, error: null }
    }, 'useEventMedia.uploadMedia')

    const result = await wrappedUpload()
    if (result?.error) {
      logError(result.error, 'useEventMedia.uploadMedia')
      return { success: false, error: result.error.message }
    }
    return { success: true, error: null }
  }, [fetchMedia])

  const refetch = useCallback(async () => {
    await fetchMedia()
  }, [fetchMedia])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  // Set up real-time subscription
  useEffect(() => {
    if (!eventId) return

    const subscription = subscribeToEventMedia(eventId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Refetch to get the new media with uploader info
        fetchMedia()
      } else if (payload.eventType === 'DELETE') {
        setMedia(prev => prev.filter(m => m.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId, fetchMedia])

  return {
    media,
    loading,
    error,
    uploadMedia,
    refetch,
  }
} 