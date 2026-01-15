'use client'

import Link from 'next/link'
import { Book as BookIcon, User, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface Book {
  id: string
  title: string
  author: string
  condition?: string
  category: { name: string }
  owner: { name: string }
  loans: any[]
  waitlist: any[]
}

export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  const isOnLoan = book?.loans?.length > 0
  const waitlistCount = book?.waitlist?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/book/${book?.id}`}>
        <div className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
          {/* Status Badge */}
          {isOnLoan && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>On Loan</span>
            </div>
          )}

          {/* Book Icon */}
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>

          {/* Book Info */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {book?.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">by {book?.author}</p>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-500">
              <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                {book?.category?.name}
              </span>
              {book?.condition && (
                <span className="ml-2 text-xs text-gray-400">• {book?.condition}</span>
              )}
            </div>
            <div className="flex items-center text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span className="text-xs">Owner: {book?.owner?.name}</span>
            </div>
            {waitlistCount > 0 && (
              <div className="text-xs text-gray-500">
                {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}