'use client'

import { BookCover } from './book-cover'
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react'

interface Loan {
  id: string
  startDate: string
  dueDate: string
  returnedDate?: string | null
  status: string
  book: {
    id: string
    title: string
    author: string
    coverUrl?: string | null
  }
  borrower?: {
    id: string
    name: string
    email: string
  }
}

interface LoanCardProps {
  loan: Loan
  type: 'borrowed' | 'lent'
  onReturn?: (loanId: string) => void
  actionLoading?: boolean
}

export function LoanCard({ loan, type, onReturn, actionLoading }: LoanCardProps) {
  const startDate = new Date(loan.startDate)
  const dueDate = new Date(loan.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  const daysOverdue = Math.abs(daysLeft)
  
  // Determine status color
  const getStatusColor = () => {
    if (loan.status === 'returned') return 'bg-gray-100 text-gray-600'
    if (isOverdue) return 'bg-red-100 text-red-700'
    if (daysLeft <= 1) return 'bg-red-100 text-red-700'
    if (daysLeft <= 5) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }
  
  // Get days left text and style
  const getDaysLeftDisplay = () => {
    if (loan.status === 'returned') {
      return { text: 'Returned', className: 'text-gray-500' }
    }
    if (isOverdue) {
      return { text: `OVERDUE by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`, className: 'text-red-600 font-semibold' }
    }
    if (daysLeft === 0) {
      return { text: 'Due TODAY', className: 'text-red-600 font-semibold' }
    }
    if (daysLeft === 1) {
      return { text: '1 day left', className: 'text-red-600 font-semibold' }
    }
    if (daysLeft <= 5) {
      return { text: `${daysLeft} days left`, className: 'text-yellow-600 font-medium' }
    }
    return { text: `${daysLeft} days left`, className: 'text-green-600' }
  }
  
  const daysLeftDisplay = getDaysLeftDisplay()

  return (
    <div className={`bg-white rounded-lg border ${isOverdue && loan.status !== 'returned' ? 'border-red-300' : 'border-gray-200'} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex gap-4">
        {/* Book Cover */}
        <BookCover 
          coverUrl={loan.book.coverUrl} 
          title={loan.book.title} 
          size="sm"
        />
        
        {/* Loan Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{loan.book.title}</h3>
            <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {loan.status === 'returned' ? 'Returned' : loan.status === 'overdue' || isOverdue ? 'Overdue' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">by {loan.book.author}</p>
          
          {/* Loan Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {type === 'lent' && loan.borrower && (
              <div className="col-span-2 flex items-center text-gray-600">
                <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate">Borrowed by: <strong>{loan.borrower.name}</strong></span>
              </div>
            )}
            <div className="flex items-center text-gray-500">
              <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span>Borrowed: {startDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span>Due: {dueDate.toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* Days Left Indicator */}
          {loan.status !== 'returned' && (
            <div className={`flex items-center ${daysLeftDisplay.className} text-sm`}>
              {isOverdue && <AlertTriangle className="h-4 w-4 mr-1.5" />}
              {daysLeftDisplay.text}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      {loan.status !== 'returned' && onReturn && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onReturn(loan.id)}
            disabled={actionLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Returned
          </button>
        </div>
      )}
    </div>
  )
}
