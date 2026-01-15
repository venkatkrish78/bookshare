'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Book, Clock, CheckCircle, AlertCircle, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { LoanCard } from '@/components/loan-card'
import { BookCover } from '@/components/book-cover'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [myBooks, setMyBooks] = useState<any[]>([])
  const [borrowedLoans, setBorrowedLoans] = useState<any[]>([])
  const [lentLoans, setLentLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      setBorrowedLoans(borrowedData?.loans || [])
      setLentLoans(lentData?.loans || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (loanId: string) => {
    setActionLoading(loanId)
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
    } finally {
      setActionLoading(null)
    }
  }

  // Separate active and returned loans
  const activeBorrowedLoans = borrowedLoans.filter(l => l.status !== 'returned')
  const returnedBorrowedLoans = borrowedLoans.filter(l => l.status === 'returned')
  const activeLentLoans = lentLoans.filter(l => l.status !== 'returned')
  const returnedLentLoans = lentLoans.filter(l => l.status === 'returned')

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
                  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow h-full">
                    <div className="flex gap-3">
                      <BookCover coverUrl={book?.coverUrl} title={book?.title} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book?.title}</h3>
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
                            <span className="text-xs text-orange-600 font-medium">On loan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* Books I'm Borrowing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-orange-600" />
            Books I'm Borrowing ({activeBorrowedLoans.length})
          </h2>

          {activeBorrowedLoans.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You're not borrowing any books</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBorrowedLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  type="borrowed"
                  onReturn={handleReturn}
                  actionLoading={actionLoading === loan.id}
                />
              ))}
            </div>
          )}

          {/* Previously Returned Books */}
          {returnedBorrowedLoans.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Previously Borrowed ({returnedBorrowedLoans.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {returnedBorrowedLoans.slice(0, 6).map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    type="borrowed"
                  />
                ))}
              </div>
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
            Books I've Lent ({activeLentLoans.length})
          </h2>

          {activeLentLoans.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No books have been borrowed from you yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLentLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  type="lent"
                  onReturn={handleReturn}
                  actionLoading={actionLoading === loan.id}
                />
              ))}
            </div>
          )}

          {/* Previously Returned Books */}
          {returnedLentLoans.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Previously Lent ({returnedLentLoans.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {returnedLentLoans.slice(0, 6).map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    type="lent"
                  />
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
