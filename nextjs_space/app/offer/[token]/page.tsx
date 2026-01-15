'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function OfferContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const action = searchParams?.get('action')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (action && params?.token) {
      handleAction(action)
    }
  }, [action, params?.token])

  const handleAction = async (actionType: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/waitlist/${params?.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: actionType === 'accept' 
            ? 'Book accepted! You can now pick it up from the owner.'
            : 'Offer declined. The book will be offered to the next person in line.',
          action: actionType
        })
      } else {
        setResult({
          success: false,
          message: data?.error || 'Failed to process your response'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Something went wrong. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your response...</p>
        </div>
      </div>
    )
  }

  if (!action) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Invalid offer link</p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {result.success && result.action === 'accept' ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : result.success && result.action === 'decline' ? (
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}

            <h2 className={`text-2xl font-bold mb-3 ${
              result.success ? 'text-gray-900' : 'text-red-600'
            }`}>
              {result.success && result.action === 'accept' ? 'Book Accepted!' :
               result.success && result.action === 'decline' ? 'Offer Declined' :
               'Error'}
            </h2>

            <p className="text-gray-600 mb-6">{result.message}</p>

            {result.success && result.action === 'accept' && (
              <a
                href="/profile"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                View My Books
              </a>
            )}

            {result.success && result.action === 'decline' && (
              <a
                href="/"
                className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Browse Catalog
              </a>
            )}

            {!result.success && (
              <a
                href="/"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Go to Home
              </a>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}

export default function OfferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <OfferContent />
    </Suspense>
  )
}