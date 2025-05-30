'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
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

  const fetchMedia = useCallback(async () => {
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
  }, [eventId])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

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
        alert('Something went wrong uploading your photo. Please try again.')
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
        alert('Something went wrong saving your photo. Please try again.')
        return
      }

      // Refresh media list
      await fetchMedia()

    } catch (err) {
      console.error('❌ Unexpected error uploading:', err)
      alert('Something went wrong. Please try again.')
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
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-medium text-stone-800 mb-4">Moments</h2>
        <div className="bg-stone-50 rounded-lg p-8 text-center">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-600">Loading moments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-stone-800">Moments</h2>
        <span className="text-sm text-stone-500">{media.length} shared</span>
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
          <div className={`border-2 border-dashed border-stone-300 rounded-lg p-6 text-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-600 rounded-full animate-spin mr-3"></div>
                <span className="text-stone-600">Uploading your moment...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-stone-700 font-medium mb-1">Share a moment from the day</p>
                <p className="text-stone-500 text-sm">Upload a photo or video to preserve this memory</p>
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
              <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative">
                {item.media_type === 'image' ? (
                  <Image
                    src={getMediaUrl(item.storage_path)}
                    alt={item.caption || 'Wedding moment'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                <p className="text-sm text-stone-600 mt-2 truncate">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-stone-50 rounded-lg p-8 text-center">
          <p className="text-stone-600 mb-1">No memories yet—but they're coming.</p>
          <p className="text-stone-500 text-sm">Be the first to share a moment from this special day.</p>
        </div>
      )}
    </div>
  )
} 