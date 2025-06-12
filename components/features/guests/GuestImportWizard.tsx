'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { FileUpload } from './FileUpload'
import { ColumnMapping } from './ColumnMapping'
import { ImportPreview } from './ImportPreview'
import { 
  parseCSVFile, 
  parseExcelFile, 
  autoDetectColumnMapping,
  validateImportedGuests,
  convertToEventGuests,
  generateSampleCSV,
  type ParsedFileResult,
  type ColumnMappingType,
  type ImportValidationResult,
  type GuestImportData
} from '@/lib/guest-import'
import { supabase } from '@/lib/supabase'

interface GuestImportWizardProps {
  eventId: string
  onSuccess: (importedCount: number) => void
  onCancel: () => void
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete'

export const GuestImportWizard: React.FC<GuestImportWizardProps> = ({
  eventId,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [parsedData, setParsedData] = useState<ParsedFileResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMappingType>({})
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: File Upload
  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      let result: ParsedFileResult

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        result = await parseCSVFile(file)
      } else {
        result = await parseExcelFile(file)
      }

      if (!result.success) {
        setError(result.error!)
        setIsLoading(false)
        return
      }

      if (!result.data || result.data.length === 0) {
        setError('No data found in the file')
        setIsLoading(false)
        return
      }

      setParsedData(result)
      
      // Auto-detect column mappings
      const autoMapping = autoDetectColumnMapping(result.headers!)
      setColumnMapping(autoMapping)
      
      setCurrentStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Step 2: Column Mapping
  const handleMappingComplete = useCallback(() => {
    if (!parsedData?.data) return

    setIsLoading(true)
    setError(null)

    try {
      const validation = validateImportedGuests(
        parsedData.data,
        columnMapping
      )

      setValidationResult(validation)
      setCurrentStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsLoading(false)
    }
  }, [parsedData, columnMapping])

  // Step 3: Import Guests
  const handleImport = useCallback(async (guests: GuestImportData[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const eventGuests = convertToEventGuests(guests, eventId)
      
      // Batch insert guests
      const { data, error: insertError } = await supabase
        .from('event_guests')
        .insert(eventGuests)
        .select()

      if (insertError) {
        throw new Error(`Failed to import guests: ${insertError.message}`)
      }

      setCurrentStep('complete')
      onSuccess(data?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }, [eventId, onSuccess])

  // Download sample CSV
  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'guest-list-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Reset wizard
  const handleReset = () => {
    setCurrentStep('upload')
    setParsedData(null)
    setColumnMapping({})
    setValidationResult(null)
    setError(null)
    setIsLoading(false)
  }

  const canProceedFromMapping = () => {
    return Object.values(columnMapping).includes('guest_name')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          Import Guest List
        </h2>
        <p className="text-stone-600">
          Upload your spreadsheet to quickly add all your guests
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { step: 'upload', label: 'Upload', icon: '📁' },
            { step: 'mapping', label: 'Map Columns', icon: '🔗' },
            { step: 'preview', label: 'Preview', icon: '👀' },
            { step: 'complete', label: 'Complete', icon: '✅' },
          ].map((item, index) => {
            const isActive = currentStep === item.step
            const isCompleted = ['upload', 'mapping', 'preview'].indexOf(currentStep) > index
            
            return (
              <React.Fragment key={item.step}>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-purple-100 text-purple-800' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-stone-100 text-stone-600'
                }`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-green-300' : 'bg-stone-300'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              onError={setError}
              isLoading={isLoading}
            />
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-4">
                <span className="text-stone-500 text-sm">Need a template?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                >
                  Download Sample CSV
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'mapping' && parsedData && (
          <div className="space-y-6">
            <ColumnMapping
              headers={parsedData.headers!}
              mapping={columnMapping}
              onMappingChange={setColumnMapping}
              sampleData={parsedData.data?.slice(0, 3)}
            />
            
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Back to Upload
              </Button>
              
              <Button
                onClick={handleMappingComplete}
                disabled={!canProceedFromMapping() || isLoading}
                isLoading={isLoading}
              >
                Validate & Preview
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && validationResult && (
          <ImportPreview
            validationResult={validationResult}
            onImport={handleImport}
            onBack={() => setCurrentStep('mapping')}
            isImporting={isLoading}
          />
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">
              Import Complete!
            </h3>
            <p className="text-stone-600 mb-6">
              Your guests have been successfully imported and are ready for invitations.
            </p>
            <div className="space-x-3">
              <Button onClick={onCancel}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
              >
                Import More Guests
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Button */}
      {currentStep !== 'complete' && (
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel Import
          </Button>
        </div>
      )}
    </div>
  )
} 