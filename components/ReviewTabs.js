'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Building2 } from 'lucide-react'

const tabs = [
  { href: '/dashboard/pending', label: 'Grants Review', icon: ClipboardList },
  { href: '/dashboard/pending/anbi', label: 'ANBI Fondsen', icon: Building2, badge: 53 },
]

export default function ReviewTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-[#312117] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                isActive ? 'bg-[#D39D33] text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
