'use client'

import { useAuth } from './auth-provider'
import Link from 'next/link'
import { Book, User, LogOut, Plus, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Book className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              BookShare
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Catalog
            </Link>
            {user ? (
              <>
                {user.emailVerified && (
                  <Link href="/books/new" className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Add Book</span>
                  </Link>
                )}
                <Link href="/profile" className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className="flex items-center space-x-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  Register
                </Link>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Catalog
              </Link>
              {user ? (
                <>
                  {user.emailVerified && (
                    <Link href="/books/new" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <Plus className="h-4 w-4" />
                      <span>Add Book</span>
                    </Link>
                  )}
                  <Link href="/profile" className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-center" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}