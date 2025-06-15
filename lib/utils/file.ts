import { UI_CONFIG } from '@/lib/constants'

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    ...UI_CONFIG.FILE_UPLOAD.ACCEPTED_IMAGE_TYPES,
    ...UI_CONFIG.FILE_UPLOAD.ACCEPTED_VIDEO_TYPES
  ]
  return validTypes.includes(file.type as typeof validTypes[number])
}

export const isValidFileSize = (file: File): boolean => {
  const maxSizeBytes = UI_CONFIG.FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024
  return file.size <= maxSizeBytes
} 