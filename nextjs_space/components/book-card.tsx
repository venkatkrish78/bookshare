'use client'

import Link from 'next/link'
import { User, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { BookCover } from './book-cover'

interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string | null
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
        <div className="group relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
          <div className="flex gap-4">
            {/* Book Cover */}
            <BookCover 
              coverUrl={book?.coverUrl} 
              title={book?.title} 
              size="sm"
              className="group-hover:scale-105 transition-transform"
            />

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              {/* Title and Status Badge Row */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors flex-1">
                  {book?.title}
                </h3>
                {isOnLoan && (
                  <div className="flex-shrink-0 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>On Loan</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">by {book?.author}</p>

              {/* Metadata */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center flex-wrap gap-1">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                    {book?.category?.name}
                  </span>
                  {book?.condition && (
                    <span className="text-xs text-gray-400">• {book?.condition}</span>
                  )}
                </div>
                <div className="flex items-center text-gray-500">
                  <User className="h-3 w-3 mr-1" />
                  <span className="text-xs truncate">Owner: {book?.owner?.name}</span>
                </div>
                {waitlistCount > 0 && (
                  <div className="text-xs text-gray-500">
                    {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
