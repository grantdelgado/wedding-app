// UI helper utilities
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