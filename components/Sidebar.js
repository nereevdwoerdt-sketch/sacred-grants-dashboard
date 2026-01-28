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
        <div className="flex flex-col flex-grow bg-sacred-900 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-sacred-950">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-serif font-bold text-white">Sacred Foundation</span>
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
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                      ? 'bg-sacred-800 text-white'
                      : 'text-sacred-200 hover:bg-sacred-800 hover:text-white'}
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-sacred-800">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-sacred-700 flex items-center justify-center text-white font-medium">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-sacred-300 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-sacred-300 hover:text-white hover:bg-sacred-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-earth-200 z-50">
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
                  ${isActive ? 'text-sacred-600' : 'text-earth-500'}
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
