'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Book, Clock, CheckCircle, AlertCircle, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [myBooks, setMyBooks] = useState<any[]>([])
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([])
  const [lentBooks, setLentBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [booksRes, borrowedRes, lentRes] = await Promise.all([
        fetch('/api/books?status=all'),
        fetch('/api/loans?type=borrowed'),
        fetch('/api/loans?type=lent')
      ])

      const booksData = await booksRes.json()
      const borrowedData = await borrowedRes.json()
      const lentData = await lentRes.json()

      setMyBooks(booksData?.books?.filter((b: any) => b?.owner?.id === user?.id) || [])
      setBorrowedBooks(borrowedData?.loans || [])
      setLentBooks(lentData?.loans || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (loanId: string) => {
    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST'
      })

      if (res.ok) {
        toast.success('Book marked as returned!')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to return book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-indigo-100">{user?.email}</p>
                {user?.isAdmin && (
                  <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Email Verification Warning */}
        {!user?.emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Email not verified</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please verify your email to list books and make requests.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* My Books */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Book className="h-6 w-6 mr-2 text-indigo-600" />
              My Books ({myBooks?.length || 0})
            </h2>
            {user?.emailVerified && (
              <Link
                href="/books/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Add Book
              </Link>
            )}
          </div>

          {myBooks?.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Book className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You haven't listed any books yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBooks?.map((book) => (
                <Link key={book?.id} href={`/book/${book?.id}`}>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-1">{book?.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {book?.author}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        book?.status === 'approved' ? 'bg-green-100 text-green-700' :
                        book?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        book?.status === 'paused' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {book?.status}
                      </span>
                      {book?.loans?.length > 0 && (
                        <span className="text-xs text-gray-500">On loan</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* Borrowed Books */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-orange-600" />
            Books I'm Borrowing ({borrowedBooks?.length || 0})
          </h2>

          {borrowedBooks?.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You're not borrowing any books</p>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowedBooks?.map((loan) => (
                <div key={loan?.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan?.book?.title}</h3>
                      <p className="text-sm text-gray-600">by {loan?.book?.author}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(loan?.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    {loan?.status === 'active' && (
                      <button
                        onClick={() => handleReturn(loan?.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Mark as Returned
                      </button>
                    )}
                    {loan?.status === 'returned' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Returned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Books I've Lent */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
            Books I've Lent ({lentBooks?.length || 0})
          </h2>

          {lentBooks?.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No books have been borrowed from you yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lentBooks?.map((loan) => (
                <div key={loan?.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan?.book?.title}</h3>
                      <p className="text-sm text-gray-600">Borrowed by: {loan?.borrower?.name}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(loan?.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    {loan?.status === 'active' && (
                      <button
                        onClick={() => handleReturn(loan?.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Mark as Returned
                      </button>
                    )}
                    {loan?.status === 'returned' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Returned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}