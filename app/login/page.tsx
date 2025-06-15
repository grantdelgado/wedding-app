'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    // Clean and validate phone number
    const cleanPhone = phone.replace(/\D/g, '')
    console.log('Clean phone:', cleanPhone)
    
    if (!isValidPhoneNumber(cleanPhone)) {
      setMessage('Please enter a valid phone number')
      setIsLoading(false)
      return
    }
    
    // Format for international use (assuming US numbers for now)
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`
    console.log('Formatted phone:', formattedPhone)
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ 
        phone: formattedPhone
      })
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        setMessage(`Failed to send verification code: ${error.message}`)
        console.error('OTP send error:', error)
      } else {
        setMessage('Verification code sent!')
        setStep('verify')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setMessage('Network error. Please check your connection and try again.')
    }
    
    setIsLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    const cleanPhone = phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`
    
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    })
    
    if (error) {
      setMessage('Invalid verification code. Please try again.')
      console.error('OTP verify error:', error)
    }
    // Success will be handled by auth state change
    setIsLoading(false)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatPhoneNumber(value)
    setPhone(formatted)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only digits
    if (value.length <= 6) {
      setOtp(value)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-stone-800 mb-2 tracking-tight">
            unveil
          </h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto mb-6"></div>
          <p className="text-stone-600">
            {step === 'phone' 
              ? 'Enter your phone number to get started' 
              : 'Enter the verification code we sent you'
            }
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all outline-none text-lg"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-stone-500 mt-1">
                  We&apos;ll send you a verification code
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !phone.trim()}
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-stone-500 mt-1 text-center">
                  Sent to {phone}
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setMessage('')
                }}
                className="w-full py-2 text-stone-600 hover:text-stone-800 text-sm transition-colors"
              >
                ← Back to phone number
              </button>
            </form>
          )}
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
              message.includes('Failed') || message.includes('Invalid')
                ? 'bg-red-50 text-red-700 border border-red-100' 
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-stone-500 mt-6">
          We&apos;ll send you a secure verification code
        </p>
      </div>
    </div>
  )
}
