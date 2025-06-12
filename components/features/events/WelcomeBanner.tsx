'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface WelcomeBannerProps {
  guestCount: number
  hasSubEvents: boolean
  onImportGuests?: () => void
  onSetupEvents?: () => void
  onSendFirstMessage?: () => void
}

export function WelcomeBanner({ 
  guestCount, 
  hasSubEvents, 
  onImportGuests,
  onSetupEvents,
  onSendFirstMessage 
}: WelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Calculate completion status
  const hasGuests = guestCount > 0
  const completedSteps = [hasGuests, hasSubEvents].filter(Boolean).length
  const totalSteps = 2
  
  // Don't show if all steps completed or dismissed
  if (isDismissed || completedSteps === totalSteps) {
    return null
  }

  const steps = [
    {
      id: 'guests',
      title: 'Import your guest list',
      description: 'Upload a spreadsheet or add guests manually to get started',
      completed: hasGuests,
      action: onImportGuests,
      icon: '👥',
      buttonText: 'Import Guests'
    },
    {
      id: 'events',
      title: 'Set up your event schedule',
      description: 'Add ceremony, reception, and other celebration times',
      completed: hasSubEvents,
      action: onSetupEvents,
      icon: '🗓️',
      buttonText: 'Setup Schedule'
    }
  ]

  const nextStep = steps.find(step => !step.completed)

  return (
    <div className="bg-gradient-to-br from-purple-50 via-rose-50 to-amber-50 border border-purple-200/60 rounded-2xl p-6 mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-10">
        <div className="text-8xl">✨</div>
      </div>
      
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="text-4xl">👋</div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">
              Welcome to your wedding hub!
            </h2>
            <p className="text-stone-600 max-w-2xl">
              You&apos;re just a few steps away from creating a beautiful space where your guests can 
              RSVP, share photos, and stay connected throughout your celebration.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">
              Setup Progress
            </span>
            <span className="text-sm text-stone-600">
              {completedSteps} of {totalSteps} completed
            </span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-rose-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Next Step Highlight */}
        {nextStep && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{nextStep.icon}</div>
                <div>
                  <h3 className="font-semibold text-stone-800">
                    Next: {nextStep.title}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {nextStep.description}
                  </p>
                </div>
              </div>
              <Button 
                onClick={nextStep.action}
                className="flex-shrink-0"
                size="sm"
              >
                {nextStep.buttonText}
              </Button>
            </div>
          </div>
        )}

        {/* All Steps Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                step.completed 
                  ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-800' 
                  : 'bg-white/40 border-stone-200/60 text-stone-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">{step.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.completed && (
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mt-1">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion celebration */}
        {completedSteps === totalSteps && (
          <div className="mt-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-stone-800 mb-1">
              Your wedding hub is ready!
            </h3>
            <p className="text-sm text-stone-600">
              Guests can now RSVP and start sharing in your celebration
            </p>
            {onSendFirstMessage && (
              <Button 
                onClick={onSendFirstMessage}
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                Send Welcome Message
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 