import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { UI_CONFIG } from './constants'

// Tailwind utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatEventDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatEventDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return formatEventDate(timestamp)
}

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

// Array utilities
export const groupBy = <T, K extends keyof unknown>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item)
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export const uniqueBy = <T, K>(array: T[], key: (item: T) => K): T[] => {
  const seen = new Set<K>()
  return array.filter(item => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = UI_CONFIG.TIMEOUTS.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// URL utilities
export const getSupabaseFileUrl = (bucket: string, path: string): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// Error handling utilities
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

export const isSupabaseError = (error: unknown): boolean => {
  return error !== null && 
         typeof error === 'object' && 
         'message' in error && 
         'code' in error
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digits and check if it's a valid US phone number
  const digitsOnly = phone.replace(/\D/g, '')
  
  // US phone numbers: 10 digits (with optional +1 country code)
  if (digitsOnly.length === 10) return true
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) return true
  
  return false
}

export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, '')
  
  // Limit to 11 digits (1 + 10 digit US number)
  const truncated = digitsOnly.slice(0, 11)
  
  // Format based on length
  if (truncated.length === 0) return ''
  if (truncated.length <= 3) return truncated
  if (truncated.length <= 6) return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`
  if (truncated.length <= 10) {
    return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`
  }
  
  // Handle 11-digit number (with country code)
  return `+${truncated.slice(0, 1)} (${truncated.slice(1, 4)}) ${truncated.slice(4, 7)}-${truncated.slice(7)}`
}

export const normalizePhoneNumber = (phone: string): string => {
  // Convert to international format for database storage
  const digitsOnly = phone.replace(/\D/g, '')
  
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`
  }
  
  return phone // Return as-is if not a recognized format
}

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// RSVP utilities
export const getRSVPStatusColor = (status: string | null): string => {
  switch (status) {
    case 'Attending': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Declined': return 'bg-stone-100 text-stone-700 border-stone-200'
    case 'Maybe': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-purple-50 text-purple-700 border-purple-200'
  }
}

export const getRSVPStatusIcon = (status: string | null): string => {
  switch (status) {
    case 'Attending': return '✓'
    case 'Declined': return '✗'
    case 'Maybe': return '?'
    default: return '○'
  }
}

// Message utilities
export const getMessageTypeStyle = (type: string, isOwnMessage: boolean): string => {
  if (type === 'announcement') {
    return 'bg-purple-50 border border-purple-200 text-purple-900'
  }
  
  if (isOwnMessage) {
    return 'bg-stone-800 text-white ml-auto'
  }
  
  return 'bg-stone-100 text-stone-900'
}

// Local storage utilities
export const setLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
} 