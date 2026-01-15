'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Printer, Download } from 'lucide-react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'

export default function PrintQRPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState<any[]>([])
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchBooks()
      }
    }
  }, [user, authLoading])

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books?status=approved')
      const data = await res.json()
      const approvedBooks = data?.books || []
      setBooks(approvedBooks)
      
      // Generate QR codes for all books
      const codes: { [key: string]: string } = {}
      for (const book of approvedBooks) {
        const url = `${window.location.origin}/book/${book?.id}`
        const qr = await QRCode.toDataURL(url, { width: 200 })
        codes[book?.id] = qr
      }
      setQrCodes(codes)
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
    <>
      {/* Print button - hidden when printing */}
      <div className="print:hidden bg-white border-b py-4 sticky top-16 z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Print QR Labels</h1>
              <p className="text-sm text-gray-600 mt-1">{books?.length} book labels ready to print</p>
            </div>
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Labels
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Grid */}
      <div className="min-h-screen py-8 print:py-0">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 print:max-w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
            {books?.map((book, index) => (
              <motion.div
                key={book?.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 print:border-solid print:border-gray-400 print:break-inside-avoid"
              >
                <div className="text-center">
                  {qrCodes[book?.id] && (
                    <img
                      src={qrCodes[book?.id]}
                      alt={`QR Code for ${book?.title}`}
                      className="w-32 h-32 mx-auto mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{book?.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-1">{book?.author}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{book?.id.slice(0, 8)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </>
  )
}