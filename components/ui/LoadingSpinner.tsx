import React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  label?: string
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const spinnerVariants = {
  primary: 'border-stone-300 border-t-stone-600',
  secondary: 'border-purple-200 border-t-purple-600',
  white: 'border-white/30 border-t-white',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...',
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'border-2 rounded-full animate-spin',
          spinnerSizes[size],
          spinnerVariants[variant]
        )}
        role="status"
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export const LoadingPage: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="secondary" className="mb-4" />
        <p className="text-stone-600">{message}</p>
      </div>
    </div>
  )
}

export const LoadingCard: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" className="mr-3" />
        <span className="text-stone-600">{message}</span>
      </div>
    </div>
  )
} 