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