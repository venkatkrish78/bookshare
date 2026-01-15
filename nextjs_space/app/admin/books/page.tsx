'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, Edit2, Trash2, X, Check, Search } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function BooksManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBook, setEditingBook] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchBooks()
        fetchCategories()
      }
    }
  }, [user, authLoading])

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/admin/books')
      const data = await res.json()
      setBooks(data?.books || [])
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data?.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleEdit = async (bookId: string) => {
    if (!editingBook) return
    setActionLoading(bookId)
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBook)
      })

      if (res.ok) {
        toast.success('Book updated successfully')
        setEditingBook(null)
        fetchBooks()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to update book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (bookId: string) => {
    setActionLoading(bookId)
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Book deleted successfully')
        setDeleteConfirm(null)
        fetchBooks()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to delete book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAUSED: 'bg-gray-100 text-gray-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || book.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Books Management</h1>
          <p className="text-gray-600 mt-2">{books?.length} total book{books?.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBooks?.map((book, index) => (
                  <motion.tr
                    key={book?.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      {editingBook?.id === book.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingBook.title}
                            onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            value={editingBook.author}
                            onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Author"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{book?.title}</p>
                          <p className="text-sm text-gray-500">by {book?.author}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{book?.owner?.name}</p>
                        <p className="text-xs text-gray-500">{book?.owner?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingBook?.id === book.id ? (
                        <select
                          value={editingBook.categoryId}
                          onChange={(e) => setEditingBook({ ...editingBook, categoryId: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-600">{book?.category?.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingBook?.id === book.id ? (
                        <select
                          value={editingBook.status}
                          onChange={(e) => setEditingBook({ ...editingBook, status: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="APPROVED">Approved</option>
                          <option value="PENDING">Pending</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="PAUSED">Paused</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(book?.status)}`}>
                          {book?.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div>{book?._count?.loans || 0} loans</div>
                        <div>{book?._count?.waitlist || 0} waiting</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {editingBook?.id === book.id ? (
                          <>
                            <button
                              onClick={() => handleEdit(book.id)}
                              disabled={actionLoading === book.id}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingBook(null)}
                              className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : deleteConfirm === book.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(book.id)}
                              disabled={actionLoading === book.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingBook({
                                id: book.id,
                                title: book.title,
                                author: book.author,
                                categoryId: book.categoryId,
                                condition: book.condition,
                                status: book.status
                              })}
                              className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(book.id)}
                              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBooks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No books found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
