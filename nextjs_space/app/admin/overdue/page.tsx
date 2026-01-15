'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function OverdueLoansPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchOverdueLoans()
      }
    }
  }, [user, authLoading])

  const fetchOverdueLoans = async () => {
    try {
      const res = await fetch('/api/admin/overdue')
      const data = await res.json()
      setLoans(data?.loans || [])
    } catch (error) {
      console.error('Failed to fetch overdue loans:', error)
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
        fetchOverdueLoans()
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
          <h1 className="text-3xl font-bold text-gray-900">Overdue Loans</h1>
          <p className="text-gray-600 mt-2">{loans?.length} overdue loan{loans?.length !== 1 ? 's' : ''}</p>
        </div>

        {loans?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">No overdue loans - great!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans?.map((loan, index) => {
              const daysOverdue = Math.floor((new Date().getTime() - new Date(loan?.dueDate).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <motion.div
                  key={loan?.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-start mb-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{loan?.book?.title}</h3>
                          <p className="text-gray-600">by {loan?.book?.author}</p>
                        </div>
                      </div>
                      <div className="ml-7 space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Borrower:</span> {loan?.borrower?.name} ({loan?.borrower?.email})
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Owner:</span> {loan?.book?.owner?.name} ({loan?.book?.owner?.email})
                        </p>
                        <p className="text-red-600 font-medium">
                          Due: {new Date(loan?.dueDate).toLocaleDateString()} ({daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturn(loan?.id)}
                      disabled={actionLoading === loan?.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center md:ml-4"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Returned
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}