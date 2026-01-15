'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
      link: '/'
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
        </motion.div>
      </div>
    </div>
  )
}