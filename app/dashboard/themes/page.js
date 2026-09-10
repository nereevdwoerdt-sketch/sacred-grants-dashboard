'use client'

import Link from 'next/link'
import { themes, getThemeGrants } from '@/lib/themes-config'
import { grants } from '@/lib/grants-data'
import { parseISO, differenceInDays } from 'date-fns'
import { ArrowRight, Clock, Share2 } from 'lucide-react'

const colorMap = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
}

const approvedGrants = grants.filter(g => g.approved)

export default function ThemesPage() {
  const today = new Date()

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-earth-900">Thema&apos;s / Themes</h1>
        <p className="text-earth-600 mt-1">
          Deel een specifiek thema met de juiste mensen — elke pagina heeft zijn eigen link.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {themes.map(theme => {
          const themeGrants = getThemeGrants(theme.id, approvedGrants)
          const colors = colorMap[theme.color] || colorMap.blue

          const urgentCount = themeGrants.filter(g => {
            if (g.deadline === 'rolling' || g.deadline === 'various') return false
            const days = differenceInDays(parseISO(g.deadline), today)
            return days >= 0 && days <= 60
          }).length

          const maxAmount = Math.max(...themeGrants.map(g => g.amount?.max || 0))
          const formatAmount = (amt) => {
            if (amt >= 1000000) return `€${(amt / 1000000).toFixed(0)}M+`
            if (amt >= 1000) return `€${(amt / 1000).toFixed(0)}K`
            return `€${amt}`
          }

          const regionCounts = {}
          themeGrants.forEach(g => {
            const r = g.region === 'au' ? '🇦🇺' : g.region === 'nl' ? '🇳🇱' : g.region === 'eu' ? '🇪🇺' : g.region === 'pe' ? '🇵🇪' : '🌍'
            regionCounts[r] = (regionCounts[r] || 0) + 1
          })

          return (
            <Link
              key={theme.id}
              href={`/dashboard/themes/${theme.id}`}
              className={`${colors.bg} ${colors.border} border rounded-xl p-6 hover:shadow-lg transition-all group`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{theme.emoji}</span>
                <span className={`${colors.badge} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                  {themeGrants.length} grants
                </span>
              </div>

              <h2 className={`text-lg font-bold ${colors.text} mb-1`}>{theme.name}</h2>
              <p className="text-sm text-earth-600 mb-4">{theme.descriptionNl}</p>

              <div className="flex items-center gap-3 text-xs text-earth-500 mb-3">
                {urgentCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    {urgentCount} urgent
                  </span>
                )}
                <span>Tot {formatAmount(maxAmount)}</span>
              </div>

              <div className="flex items-center gap-1.5 mb-4">
                {Object.entries(regionCounts).map(([flag, count]) => (
                  <span key={flag} className="text-xs bg-white/60 px-1.5 py-0.5 rounded">
                    {flag} {count}
                  </span>
                ))}
              </div>

              <div className={`flex items-center gap-2 text-sm font-medium ${colors.text} group-hover:gap-3 transition-all`}>
                Bekijk grants <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
