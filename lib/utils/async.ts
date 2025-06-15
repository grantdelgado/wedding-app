import { UI_CONFIG } from '@/lib/constants'

// Async utilities
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