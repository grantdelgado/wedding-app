import { supabase } from '@/lib/supabase/client'

// Storage service functions
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  try {
    console.log(`Uploading file to ${bucket}/${path}`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
    
    const result = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      })
    
    console.log('Upload result:', result)
    return result
  } catch (error) {
    console.error('Upload exception:', error)
    throw error
  }
}

export const getPublicUrl = (bucket: string, path: string) => {
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path)
}

export const deleteFile = async (bucket: string, path: string) => {
  return await supabase.storage
    .from(bucket)
    .remove([path])
}

export const listFiles = async (bucket: string, path?: string) => {
  return await supabase.storage
    .from(bucket)
    .list(path)
}

export const downloadFile = async (bucket: string, path: string) => {
  return await supabase.storage
    .from(bucket)
    .download(path)
}

export const createSignedUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
) => {
  return await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
}

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  const filePath = `avatars/${fileName}`
  
  return await uploadFile('avatars', filePath, file, { upsert: true })
}

export const uploadEventMedia = async (
  eventId: string, 
  file: File, 
  userId: string
) => {
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${timestamp}-${userId}.${fileExt}`
  const filePath = `events/${eventId}/media/${fileName}`
  
  return await uploadFile('media', filePath, file)
} 