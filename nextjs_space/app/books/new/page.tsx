'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Book, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useDebounce } from '@/hooks/use-debounce'
import { BookCoverPreview } from '@/components/book-cover'

export default function NewBookPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    categoryId: '',
    condition: '',
    description: '',
    coverUrl: ''
  })
  
  // Cover search state
  const [isSearchingCover, setIsSearchingCover] = useState(false)
  const [coverSearchResult, setCoverSearchResult] = useState<{
    coverUrl: string | null
    source?: string
    matchedTitle?: string
  } | null>(null)
  
  // Debounced values for cover search
  const debouncedTitle = useDebounce(formData.title, 500)
  const debouncedAuthor = useDebounce(formData.author, 500)
  const debouncedIsbn = useDebounce(formData.isbn, 500)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.emailVerified) {
        router.push('/profile')
        toast.error('Please verify your email first')
      }
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchCategories()
  }, [])

  // Search for cover when title, author, or ISBN changes
  useEffect(() => {
    const searchCover = async () => {
      // Only search if we have at least a title or ISBN
      if (!debouncedTitle && !debouncedIsbn) {
        setCoverSearchResult(null)
        setFormData(prev => ({ ...prev, coverUrl: '' }))
        return
      }

      setIsSearchingCover(true)
      try {
        const params = new URLSearchParams()
        if (debouncedTitle) params.append('title', debouncedTitle)
        if (debouncedAuthor) params.append('author', debouncedAuthor)
        if (debouncedIsbn) params.append('isbn', debouncedIsbn)

        const res = await fetch(`/api/books/search-cover?${params}`)
        const data = await res.json()
        
        setCoverSearchResult(data)
        if (data?.coverUrl) {
          setFormData(prev => ({ ...prev, coverUrl: data.coverUrl }))
        } else {
          setFormData(prev => ({ ...prev, coverUrl: '' }))
        }
      } catch (error) {
        console.error('Failed to search for cover:', error)
        setCoverSearchResult(null)
      } finally {
        setIsSearchingCover(false)
      }
    }

    searchCover()
  }, [debouncedTitle, debouncedAuthor, debouncedIsbn])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data?.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn || null,
          coverUrl: formData.coverUrl || null,
          categoryId: formData.categoryId,
          condition: formData.condition || null,
          description: formData.description || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Book submitted for approval!')
        router.push('/profile')
      } else {
        toast.error(data?.error || 'Failed to submit book')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || !user.emailVerified) return null

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">List a Book</h1>
            <p className="text-gray-600 mt-2">Share a book with your community</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Preview */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Preview
                </label>
                <BookCoverPreview 
                  coverUrl={coverSearchResult?.coverUrl || null}
                  isSearching={isSearchingCover}
                  title={formData.title}
                />
                {coverSearchResult?.matchedTitle && coverSearchResult?.source === 'search' && (
                  <p className="text-xs text-gray-500 mt-2 max-w-[128px]">
                    Matched: {coverSearchResult.matchedTitle}
                  </p>
                )}
                {coverSearchResult?.source === 'isbn' && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Found by ISBN
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Book Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="The Great Gatsby"
                  />
                </div>

                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <input
                    id="author"
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="F. Scott Fitzgerald"
                  />
                </div>

                <div>
                  <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN (Optional)
                  </label>
                  <input
                    id="isbn"
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="978-0743273565"
                  />
                  <p className="text-xs text-gray-500 mt-1">For better cover matching accuracy</p>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat?.id} value={cat?.id}>
                        {cat?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition (Optional)
                  </label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="">Select condition</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="Any additional details about the book..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your book will be reviewed by an admin before it appears in the catalog.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
