import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Search for book cover from Open Library
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || ''
    const author = searchParams.get('author') || ''
    const isbn = searchParams.get('isbn') || ''

    // If ISBN is provided, try to get cover by ISBN first (most accurate)
    if (isbn) {
      const cleanIsbn = isbn.replace(/[-\s]/g, '')
      const isbnCoverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
      
      // Verify the cover exists with a HEAD request
      try {
        const headRes = await fetch(isbnCoverUrl, { method: 'HEAD' })
        // Open Library returns a 1x1 pixel image for non-existent covers
        // Check content-length to verify it's a real cover
        const contentLength = headRes.headers.get('content-length')
        if (headRes.ok && contentLength && parseInt(contentLength) > 1000) {
          return NextResponse.json({
            coverUrl: isbnCoverUrl,
            source: 'isbn',
            isbn: cleanIsbn
          })
        }
      } catch (e) {
        // ISBN cover not found, continue to search
      }
    }

    // Search by title and author
    if (!title && !author) {
      return NextResponse.json({ coverUrl: null })
    }

    const searchParams2 = new URLSearchParams()
    if (title) searchParams2.append('title', title)
    if (author) searchParams2.append('author', author)
    searchParams2.append('limit', '5')

    const searchUrl = `https://openlibrary.org/search.json?${searchParams2.toString()}`
    const searchRes = await fetch(searchUrl)
    
    if (!searchRes.ok) {
      return NextResponse.json({ coverUrl: null })
    }

    const searchData = await searchRes.json()
    const docs = searchData?.docs || []

    // Find the first result with a cover
    for (const doc of docs) {
      if (doc.cover_i) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        return NextResponse.json({
          coverUrl,
          source: 'search',
          matchedTitle: doc.title,
          isbn: doc.isbn?.[0] || null
        })
      }
    }

    return NextResponse.json({ coverUrl: null })
  } catch (error: any) {
    console.error('Search cover error:', error)
    return NextResponse.json({ coverUrl: null })
  }
}
