'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

interface BookCoverProps {
  coverUrl?: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-16 h-24',
  md: 'w-24 h-36',
  lg: 'w-32 h-48'
}

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function BookCover({ coverUrl, title, size = 'md', className = '' }: BookCoverProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const showPlaceholder = !coverUrl || imageError

  return (
    <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 ${className}`}>
      {!showPlaceholder && (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
      {(showPlaceholder || !imageLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
          <BookOpen className={`${iconSizes[size]} text-indigo-400`} />
        </div>
      )}
    </div>
  )
}

export function BookCoverPreview({ 
  coverUrl, 
  isSearching, 
  title 
}: { 
  coverUrl: string | null
  isSearching: boolean
  title?: string 
}) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
      {isSearching ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-gray-500">Searching...</span>
        </div>
      ) : coverUrl && !imageError ? (
        <img
          src={coverUrl}
          alt={title ? `Cover of ${title}` : 'Book cover preview'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
          <BookOpen className="h-10 w-10 text-indigo-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">
            {title ? 'No cover found' : 'Cover preview'}
          </span>
        </div>
      )}
    </div>
  )
}
