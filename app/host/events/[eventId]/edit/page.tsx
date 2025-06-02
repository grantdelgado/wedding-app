'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { supabase, uploadFile, getPublicUrl, deleteFile } from '@/lib/supabase'
import { cn, formatEventDate } from '@/lib/utils'
import { LoadingPage } from '@/components/ui/LoadingSpinner'
import type { Database } from '@/app/reference/supabase.types'

type Event = Database['public']['Tables']['events']['Row']
type EventUpdate = Database['public']['Tables']['events']['Update']

interface FormErrors {
  title?: string
  event_date?: string
  event_time?: string
  location?: string
  image?: string
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  // Original event data
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    event_time: '',
    location: '',
    description: '',
    is_public: true,
  })
  
  // Image upload state
  const [headerImage, setHeaderImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [imageUploadProgress, setImageUploadProgress] = useState(0)
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formMessage, setFormMessage] = useState('')

  // Load existing event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          router.push('/login')
          return
        }

        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('host_user_id', session.user.id)
          .single()

        if (eventError) {
          console.error('Error fetching event:', eventError)
          router.push('/host/dashboard')
          return
        }

        setOriginalEvent(eventData)
        
        // Parse event_date into date and time components
        const eventDateTime = new Date(eventData.event_date)
        const dateStr = eventDateTime.toISOString().split('T')[0]
        const timeStr = eventDateTime.toTimeString().slice(0, 5)
        
        setFormData({
          title: eventData.title,
          event_date: dateStr,
          event_time: timeStr,
          location: eventData.location || '',
          description: eventData.description || '',
          is_public: eventData.is_public ?? true,
        })
        
        if (eventData.header_image_url) {
          setCurrentImageUrl(eventData.header_image_url)
        }
        
        setPageLoading(false)
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/host/dashboard')
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId, router])

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Event name is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Event name must be at least 3 characters'
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required'
    }
    
    if (!formData.event_time) {
      newErrors.event_time = 'Event time is required'
    }
    
    if (headerImage && headerImage.size > 10 * 1024 * 1024) {
      newErrors.image = 'Image must be smaller than 10MB'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Image upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be smaller than 10MB' }))
        return
      }
      
      setHeaderImage(file)
      setShouldDeleteImage(false)
      setErrors(prev => ({ ...prev, image: undefined }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isLoading
  })

  // Form handlers
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const removeCurrentImage = () => {
    setCurrentImageUrl('')
    setShouldDeleteImage(true)
  }

  const removeNewImage = () => {
    setHeaderImage(null)
    setImagePreview('')
    setImageUploadProgress(0)
    setShouldDeleteImage(false)
    setErrors(prev => ({ ...prev, image: undefined }))
  }

  // Form submission
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !originalEvent) {
      return
    }
    
    setIsLoading(true)
    setFormMessage('')

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        setFormMessage('You must be logged in to update an event.')
        setIsLoading(false)
        return
      }

      const userId = session.user.id
      let headerImageUrl: string | null = currentImageUrl || null

      // Handle image upload if new image is provided
      if (headerImage) {
        setImageUploadProgress(10)
        const fileExt = headerImage.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        
        try {
          const { data: uploadData, error: uploadError } = await uploadFile(
            'event-images',
            fileName,
            headerImage
          )
          
          setImageUploadProgress(50)

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            setFormMessage(`Failed to upload image: ${uploadError.message || 'Unknown error'}. Please try again.`)
            setIsLoading(false)
            return
          }

          if (!uploadData) {
            console.error('No upload data returned')
            setFormMessage('Failed to upload image: No data returned. Please try again.')
            setIsLoading(false)
            return
          }

          // Get public URL
          const { data: urlData } = getPublicUrl('event-images', fileName)
          headerImageUrl = urlData.publicUrl
          setImageUploadProgress(80)
          
          // Delete old image if it exists and is different
          if (originalEvent.header_image_url && originalEvent.header_image_url !== headerImageUrl) {
            try {
              const oldPath = originalEvent.header_image_url.split('/').slice(-2).join('/')
              await deleteFile('event-images', oldPath)
            } catch (deleteError) {
              console.warn('Failed to delete old image:', deleteError)
            }
          }
        } catch (uploadError) {
          console.error('Image upload exception:', uploadError)
          setFormMessage(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}. Please try again.`)
          setIsLoading(false)
          return
        }
      }
      
      // Handle image deletion if requested
      if (shouldDeleteImage && originalEvent.header_image_url) {
        try {
          const oldPath = originalEvent.header_image_url.split('/').slice(-2).join('/')
          await deleteFile('event-images', oldPath)
          headerImageUrl = null
        } catch (deleteError) {
          console.warn('Failed to delete image:', deleteError)
        }
      }

      // Combine date and time
      const eventDateTime = `${formData.event_date}T${formData.event_time}:00`

      // Update the event
      const eventData: EventUpdate = {
        title: formData.title.trim(),
        event_date: eventDateTime,
        location: formData.location.trim() || null,
        description: formData.description.trim() || null,
        header_image_url: headerImageUrl,
        is_public: formData.is_public,
      }

      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single()

      setImageUploadProgress(100)

      if (updateError) {
        console.error('Error updating event:', updateError)
        setFormMessage('Something went wrong updating your event. Please try again.')
      } else if (updatedEvent) {
        setFormMessage('Event updated successfully!')
        // Navigate back to the event dashboard
        setTimeout(() => {
          router.push(`/host/events/${eventId}/dashboard`)
        }, 1500)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setFormMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) {
    return <LoadingPage message="Loading event details..." />
  }

  if (!originalEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-semibold text-stone-800 mb-4">Event Not Found</h1>
          <p className="text-stone-600 mb-6">The event you&apos;re trying to edit could not be found.</p>
          <button
            onClick={() => router.push('/host/dashboard')}
            className="bg-stone-800 text-white font-medium py-3 px-6 rounded-lg hover:bg-stone-900 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-stone-800 mb-4 tracking-tight">
            Edit Event Details
          </h1>
          <p className="text-lg text-stone-600">
            Update your event information and settings
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          <form onSubmit={handleUpdateEvent} className="space-y-8">
            
            {/* Event Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-6 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Event Details
              </h2>
              
              <div className="space-y-6">
                {/* Event Name */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-2">
                    Wedding/Event Name *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Sarah & John's Wedding"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg",
                      errors.title ? 'border-red-300 bg-red-50' : 'border-stone-200'
                    )}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Event Date */}
                  <div>
                    <label htmlFor="event_date" className="block text-sm font-medium text-stone-700 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      id="event_date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg",
                        errors.event_date ? 'border-red-300 bg-red-50' : 'border-stone-200'
                      )}
                      disabled={isLoading}
                    />
                    {errors.event_date && (
                      <p className="text-red-600 text-sm mt-1">{errors.event_date}</p>
                    )}
                  </div>

                  {/* Event Time */}
                  <div>
                    <label htmlFor="event_time" className="block text-sm font-medium text-stone-700 mb-2">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      id="event_time"
                      value={formData.event_time}
                      onChange={(e) => handleInputChange('event_time', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg",
                        errors.event_time ? 'border-red-300 bg-red-50' : 'border-stone-200'
                      )}
                      disabled={isLoading}
                    />
                    {errors.event_time && (
                      <p className="text-red-600 text-sm mt-1">{errors.event_time}</p>
                    )}
                  </div>
                </div>

                {/* Event Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Central Park, New York"
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg"
                    disabled={isLoading}
                  />
                </div>

                {/* Event Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell your guests about your special day..."
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-lg resize-none"
                    disabled={isLoading}
                  />
                  <p className="text-stone-500 text-sm mt-1">Optional: Share details about your celebration</p>
                </div>
              </div>
            </div>

            {/* Header Image Section */}
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-6 flex items-center">
                <span className="text-2xl mr-2">🖼️</span>
                Header Image
              </h2>
              
              {/* Current Image Display */}
              {currentImageUrl && !shouldDeleteImage && (
                <div className="mb-4">
                  <p className="text-sm text-stone-600 mb-2">Current image:</p>
                  <div className="relative">
                    <Image
                      src={currentImageUrl}
                      alt="Current event header"
                      width={800}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeCurrentImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* New Image Upload */}
              {!imagePreview && (!currentImageUrl || shouldDeleteImage) && (
                <div
                  {...getRootProps()}
                  className={cn(
                    "w-full p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    isDragActive 
                      ? "border-purple-400 bg-purple-50" 
                      : "border-stone-300 hover:border-purple-300 hover:bg-stone-50",
                    errors.image && "border-red-300 bg-red-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-stone-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <p className="text-lg font-medium text-stone-700">
                        {isDragActive ? 'Drop your image here' : 'Upload a new header image'}
                      </p>
                      <p className="text-stone-500 mt-1">
                        Drag & drop or click to browse • PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* New Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <p className="text-sm text-stone-600 mb-2">New image:</p>
                  <Image
                    src={imagePreview}
                    alt="New event header preview"
                    width={800}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {errors.image && (
                <p className="text-red-600 text-sm mt-1">{errors.image}</p>
              )}
              
              {imageUploadProgress > 0 && imageUploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-stone-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${imageUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-stone-600 mt-1">Uploading image...</p>
                </div>
              )}
            </div>

            {/* Settings Section */}
            <div>
              <h2 className="text-xl font-semibold text-stone-800 mb-6 flex items-center">
                <span className="text-2xl mr-2">⚙️</span>
                Settings
              </h2>
              
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-stone-300 rounded mt-0.5"
                    disabled={isLoading}
                  />
                  <div>
                    <label htmlFor="is_public" className="text-sm font-medium text-stone-700">
                      Make this wedding hub discoverable
                    </label>
                    <p className="text-stone-500 text-sm mt-1">
                      Guests will be able to find your event when they sign up with their invited phone number
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Preview */}
            {formData.title && formData.event_date && (
              <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-stone-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">👁️</span>
                  Updated Event Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {formData.title}</p>
                  <p><strong>Date:</strong> {formatEventDate(formData.event_date + 'T' + formData.event_time)}</p>
                  {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
                  {formData.description && <p><strong>Description:</strong> {formData.description}</p>}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-stone-800 text-white font-medium py-3 px-8 rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating Event...
                  </div>
                ) : (
                  'Update Event'
                )}
              </button>
            </div>

            {/* Form Message */}
            {formMessage && (
              <div className={cn(
                "p-4 rounded-lg text-center text-sm",
                formMessage.includes('wrong') || formMessage.includes('error') || formMessage.includes('Failed')
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'bg-green-50 text-green-700 border border-green-100'
              )}>
                {formMessage}
              </div>
            )}
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push(`/host/events/${eventId}/dashboard`)}
            className="text-stone-600 hover:text-stone-800 font-medium transition-colors"
            disabled={isLoading}
          >
            ← Cancel and Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 