'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/app/reference/supabase.types'

type Media = Database['public']['Tables']['media']['Row']

interface GuestPhotoGalleryProps {
  eventId: string
  currentUserId: string | null
}

export default function GuestPhotoGallery({ eventId, currentUserId }: GuestPhotoGalleryProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [eventId])

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching media:', error)
        return
      }

      setMedia(data || [])
    } catch (err) {
      console.error('❌ Unexpected error fetching media:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUserId) return

    setUploading(true)

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${eventId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(fileName, file)

      if (uploadError) {
        console.error('❌ Error uploading file:', uploadError)
        alert('Failed to upload photo. Please try again.')
        return
      }

      // Create media record in database
      const { error: insertError } = await supabase
        .from('media')
        .insert({
          event_id: eventId,
          uploader_user_id: currentUserId,
          storage_path: uploadData.path,
          media_type: file.type.startsWith('image/') ? 'image' : 'video',
          caption: null
        })

      if (insertError) {
        console.error('❌ Error creating media record:', insertError)
        alert('Failed to save photo. Please try again.')
        return
      }

      // Refresh media list
      await fetchMedia()
      alert('Photo uploaded successfully!')

    } catch (err) {
      console.error('❌ Unexpected error uploading:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getMediaUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('event-media')
      .getPublicUrl(storagePath)
    
    return data.publicUrl
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📸 Photo Gallery</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">📸 Photo Gallery</h2>
        <span className="text-sm text-gray-500">{media.length} photos</span>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <label className="block">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading || !currentUserId}
            className="hidden"
          />
          <div className={`border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></div>
                <span className="text-purple-600">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📷</div>
                <p className="text-purple-600 font-medium">Click to upload a photo or video</p>
                <p className="text-gray-500 text-sm mt-1">Share your memories from this special day</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Media Grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {item.media_type === 'image' ? (
                  <img
                    src={getMediaUrl(item.storage_path)}
                    alt={item.caption || 'Wedding photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <video
                    src={getMediaUrl(item.storage_path)}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
              </div>
              {item.caption && (
                <p className="text-sm text-gray-600 mt-1 truncate">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-gray-600">No photos yet</p>
          <p className="text-gray-500 text-sm">Be the first to share a memory!</p>
        </div>
      )}
    </div>
  )
} 