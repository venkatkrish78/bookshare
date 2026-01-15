'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Book as BookIcon, User, Clock, Users, QrCode, Pause, Play, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchBook()
    }
  }, [params?.id])

  useEffect(() => {
    if (book) {
      generateQR()
    }
  }, [book])

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${params?.id}`)
      const data = await res.json()
      setBook(data?.book)
    } catch (error) {
      console.error('Failed to fetch book:', error)
      toast.error('Failed to load book details')
    } finally {
      setLoading(false)
    }
  }

  const generateQR = async () => {
    try {
      const url = `${window.location.origin}/book/${book?.id}`
      const qr = await QRCode.toDataURL(url, { width: 200 })
      setQrCode(qr)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const handleRequest = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.emailVerified) {
      toast.error('Please verify your email first')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/books/${book?.id}/request`, {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Book borrowed successfully!')
        fetchBook()
      } else {
        toast.error(data?.error || 'Failed to request book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinWaitlist = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.emailVerified) {
      toast.error('Please verify your email first')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/books/${book?.id}/waitlist`, {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Added to waitlist!')
        fetchBook()
      } else {
        toast.error(data?.error || 'Failed to join waitlist')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = book?.status === 'paused' ? 'approved' : 'paused'
    setActionLoading(true)
    try {
      const res = await fetch(`/api/books/${book?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(newStatus === 'paused' ? 'Book paused' : 'Book resumed')
        fetchBook()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/books/${book?.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Book deleted')
        router.push('/profile')
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to delete book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Book not found</p>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === book?.owner?.id
  const isOnLoan = book?.loans?.length > 0
  const isInWaitlist = book?.waitlist?.some((entry: any) => entry?.user?.id === user?.id)
  const userPosition = book?.waitlist?.findIndex((entry: any) => entry?.user?.id === user?.id) + 1

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="flex-1 mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book?.title}</h1>
              <p className="text-lg text-gray-600">by {book?.author}</p>
            </div>
            {qrCode && (
              <div className="flex-shrink-0">
                <img src={qrCode} alt="QR Code" className="w-24 h-24 border border-gray-200 rounded-lg" />
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
              book?.status === 'approved' ? 'bg-green-100 text-green-700' :
              book?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              book?.status === 'paused' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              {book?.status === 'approved' && !isOnLoan ? '✅ Available' :
               book?.status === 'approved' && isOnLoan ? '🕒 On Loan' :
               book?.status === 'paused' ? '⏸️ Paused' :
               book?.status === 'pending' ? '⏳ Pending Approval' :
               '❌ Rejected'
              }
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
              <p className="text-gray-900">{book?.category?.name}</p>
            </div>

            {book?.condition && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Condition</h3>
                <p className="text-gray-900">{book?.condition}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Owner</h3>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <p className="text-gray-900">{book?.owner?.name}</p>
              </div>
            </div>

            {isOnLoan && book?.loans?.[0] && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Borrower</h3>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{book?.loans?.[0]?.borrower?.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {book?.description && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{book?.description}</p>
            </div>
          )}

          {/* Waitlist */}
          {book?.waitlist?.length > 0 && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 mr-2 text-gray-600" />
                <h3 className="font-medium text-gray-900">Waitlist ({book?.waitlist?.length})</h3>
              </div>
              {isInWaitlist && (
                <p className="text-sm text-indigo-600 font-medium">You are #{userPosition} in line</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!isOwner && book?.status === 'approved' && !isOnLoan && user?.emailVerified && (
              <button
                onClick={handleRequest}
                disabled={actionLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                Borrow Book
              </button>
            )}

            {!isOwner && book?.status === 'approved' && isOnLoan && !isInWaitlist && user?.emailVerified && (
              <button
                onClick={handleJoinWaitlist}
                disabled={actionLoading}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
              >
                Join Waitlist
              </button>
            )}

            {isOwner && book?.status === 'approved' && (
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                {book?.status === 'paused' ? (
                  <><Play className="h-4 w-4 mr-2" /> Resume</>
                ) : (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                )}
              </button>
            )}

            {isOwner && book?.loans?.length === 0 && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}