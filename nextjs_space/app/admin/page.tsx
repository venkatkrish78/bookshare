'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Clock, CheckCircle, Download, Database, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingBooks: 0,
    overdueLoans: 0,
    totalUsers: 0,
    totalBooks: 0
  })
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchStats()
      }
    }
  }, [user, authLoading])

  const fetchStats = async () => {
    try {
      const [pendingRes, overdueRes, usersRes, booksRes] = await Promise.all([
        fetch('/api/admin/pending'),
        fetch('/api/admin/overdue'),
        fetch('/api/admin/users'),
        fetch('/api/books?status=all')
      ])

      const [pending, overdue, users, books] = await Promise.all([
        pendingRes.json(),
        overdueRes.json(),
        usersRes.json(),
        booksRes.json()
      ])

      setStats({
        pendingBooks: pending?.books?.length || 0,
        overdueLoans: overdue?.loans?.length || 0,
        totalUsers: users?.users?.length || 0,
        totalBooks: books?.books?.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const handleDownloadBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await fetch('/api/admin/backup')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate backup')
      }
      
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `bookshare-backup-${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Backup downloaded successfully')
    } catch (error: any) {
      console.error('Backup download failed:', error)
      toast.error(error.message || 'Failed to download backup')
    } finally {
      setBackupLoading(false)
    }
  }

  if (!user?.isAdmin) return null

  const cards = [
    {
      title: 'Pending Approvals',
      value: stats.pendingBooks,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      link: '/admin/pending'
    },
    {
      title: 'Overdue Loans',
      value: stats.overdueLoans,
      icon: CheckCircle,
      color: 'from-red-500 to-pink-500',
      link: '/admin/overdue'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      link: '/admin/users'
    },
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      link: '/admin/books'
    }
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your BookShare community</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={card.link}>
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{card.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link href="/admin/pending" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h3>
            <p className="text-sm text-gray-600">Review and approve new book listings</p>
          </Link>

          <Link href="/admin/overdue" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overdue Loans</h3>
            <p className="text-sm text-gray-600">Monitor and manage overdue books</p>
          </Link>

          <Link href="/admin/users" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600">Manage users and handle abuse</p>
          </Link>

          <Link href="/admin/books" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Books Management</h3>
            <p className="text-sm text-gray-600">Edit or delete books in the catalog</p>
          </Link>
        </motion.div>

        {/* Data Backup Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Data Backup</h3>
                <p className="text-sm text-gray-600">Download or schedule automatic backups</p>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={backupLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {backupLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download Backup Now
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Downloads an Excel file with all users, books, loans, and requests data.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 flex-shrink-0">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">Automated Backup</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Weekly backups are emailed to<br />
                    <strong>venkatkrish78@gmail.com</strong><br />
                    every Monday at 9:00 AM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}