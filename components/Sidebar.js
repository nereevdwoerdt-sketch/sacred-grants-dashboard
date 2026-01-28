'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  CheckSquare,
  Download,
  TrendingUp
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Grants', href: '/dashboard/grants', icon: FileText },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
  { name: 'Setup Steps', href: '/dashboard/setup', icon: CheckSquare },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Export', href: '/dashboard/export', icon: Download },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ user, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-[#312117] overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center h-24 px-4 bg-[#2a1c14] border-b border-[#4a3828]">
            <Link href="/dashboard" className="flex items-center gap-3">
              <img
                src="/images/sacred-icon.png"
                alt="Sacred"
                className="h-14 w-14 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-serif font-bold text-[#F5F3E6] tracking-wide">SACRED</span>
                <span className="text-sm font-medium text-[#D39D33] tracking-widest">FOUNDATION</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                    ${isActive
                      ? 'bg-[#D39D33] text-white'
                      : 'text-[#d4cdb3] hover:bg-[#4a3828] hover:text-white'}
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Grants summary */}
          <div className="px-4 py-4 mx-4 mb-4 bg-[#4a3828] rounded-xl">
            <p className="text-xs text-[#d4cdb3] uppercase tracking-wider mb-2">Total Potential</p>
            <p className="text-2xl font-serif font-bold text-[#D39D33]">€2.68M+</p>
            <p className="text-xs text-[#d4cdb3] mt-1">78 grants tracked</p>
          </div>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-[#4a3828]">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#D39D33] flex items-center justify-center text-white font-medium">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'S'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Sacred Team'}
                </p>
                <p className="text-xs text-[#d4cdb3] truncate">
                  {user?.email || 'grants@sacredtaste.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-[#d4cdb3] hover:text-white hover:bg-[#4a3828] rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#312117] border-t border-[#4a3828] z-50">
        <nav className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center p-2 text-xs
                  ${isActive ? 'text-[#D39D33]' : 'text-[#d4cdb3]'}
                `}
              >
                <item.icon className="w-5 h-5 mb-1" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
