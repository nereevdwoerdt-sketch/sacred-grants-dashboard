'use client'

import { useState } from 'react'
import { Bell, Search, Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function Header({ user, profile }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-earth-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-earth-500 hover:text-earth-700 hover:bg-earth-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo for mobile */}
          <div className="lg:hidden">
            <Link href="/dashboard" className="text-lg font-serif font-bold text-sacred-900">
              Sacred
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
              <input
                type="text"
                placeholder="Search grants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 transition-colors"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 text-earth-500 hover:text-earth-700 hover:bg-earth-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>

            {/* User avatar - desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sacred-100 flex items-center justify-center text-sacred-700 font-medium text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <input
            type="text"
            placeholder="Search grants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 transition-colors"
          />
        </div>
      </div>
    </header>
  )
}
