'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Book, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function PendingApprovalsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchPendingBooks()
      }
    }
  }, [user, authLoading])

  const fetchPendingBooks = async () => {
    try {
      const res = await fetch('/api/admin/pending')
      const data = await res.json()
      setBooks(data?.books || [])
    } catch (error) {
      console.error('Failed to fetch pending books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookId: string) => {
    setActionLoading(bookId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      })

      if (res.ok) {
        toast.success('Book approved!')
        fetchPendingBooks()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to approve book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (bookId: string) => {
    if (!confirm('Are you sure you want to reject this book?')) return

    setActionLoading(bookId)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      })

      if (res.ok) {
        toast.success('Book rejected')
        fetchPendingBooks()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to reject book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user?.isAdmin) return null

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-2">{books?.length} book{books?.length !== 1 ? 's' : ''} waiting for review</p>
        </div>

        {books?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books?.map((book, index) => (
              <motion.div
                key={book?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{book?.title}</h3>
                    <p className="text-gray-600 mb-2">by {book?.author}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{book?.category?.name}</span>
                      {book?.condition && (
                        <span className="px-2 py-1 bg-gray-100 rounded">{book?.condition}</span>
                      )}
                      <span>Owner: {book?.owner?.name} ({book?.owner?.email})</span>
                    </div>
                    {book?.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{book?.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 md:ml-4">
                    <button
                      onClick={() => handleApprove(book?.id)}
                      disabled={actionLoading === book?.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(book?.id)}
                      disabled={actionLoading === book?.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}