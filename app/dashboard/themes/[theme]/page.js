'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import GrantCard from '@/components/GrantCard'
import GrantModal from '@/components/GrantModal'
import { grants, regions } from '@/lib/grants-data'
import { themes, getTheme, getThemeGrants } from '@/lib/themes-config'
import { parseISO, differenceInDays, isAfter } from 'date-fns'
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Share2,
  Check,
  ExternalLink
} from 'lucide-react'

const approvedGrants = grants.filter(g => g.approved)

export default function ThemePage() {
  const { theme: themeId } = useParams()
  const theme = getTheme(themeId)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [selectedGrant, setSelectedGrant] = useState(null)
  const [copied, setCopied] = useState(false)

  const themeGrants = useMemo(() => {
    if (!theme) return []
    return getThemeGrants(theme.id, approvedGrants)
  }, [theme])

  const filteredGrants = useMemo(() => {
    let result = [...themeGrants]

    if (activeRegion !== 'all') {
      result = result.filter(g => g.region === activeRegion)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.tags.some(t => t.includes(query))
      )
    }

    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (a.deadline === 'rolling') return 1
        if (b.deadline === 'rolling') return -1
        if (a.deadline === 'various') return 1
        if (b.deadline === 'various') return -1
        return new Date(a.deadline) - new Date(b.deadline)
      }
      if (sortBy === 'amount') return (b.amount?.max || 0) - (a.amount?.max || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [themeGrants, searchQuery, activeRegion, sortBy])

  const upcomingDeadlines = useMemo(() => {
    const today = new Date()
    return themeGrants
      .filter(g => {
        if (g.deadline === 'rolling' || g.deadline === 'various') return false
        const days = differenceInDays(parseISO(g.deadline), today)
        return days >= 0 && days <= 60
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  }, [themeGrants])

  const regionCounts = useMemo(() => {
    const counts = { all: themeGrants.length }
    themeGrants.forEach(g => { counts[g.region] = (counts[g.region] || 0) + 1 })
    return counts
  }, [themeGrants])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (!theme) {
    return (
      <div className="text-center py-12">
        <p className="text-earth-600">Thema niet gevonden.</p>
        <Link href="/dashboard/themes" className="text-sacred-600 hover:text-sacred-700 font-medium mt-4 inline-block">
          ← Terug naar thema&apos;s
        </Link>
      </div>
    )
  }

  const totalPotential = themeGrants.reduce((sum, g) => sum + (g.amount?.max || 0), 0)
  const formatAmount = (amt) => {
    if (amt >= 1000000) return `€${(amt / 1000000).toFixed(1)}M`
    if (amt >= 1000) return `€${(amt / 1000).toFixed(0)}K`
    return `€${amt}`
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/themes"
            className="text-sm text-earth-500 hover:text-earth-700 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Alle thema&apos;s
          </Link>
          <h1 className="text-2xl font-bold text-earth-900 flex items-center gap-3">
            <span className="text-3xl">{theme.emoji}</span>
            {theme.name}
          </h1>
          <p className="text-earth-600 mt-1">{theme.descriptionNl}</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-earth-300 rounded-lg hover:bg-earth-50 transition-colors text-sm"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Link gekopieerd!' : 'Deel deze pagina'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <p className="text-sm text-earth-500">Grants</p>
          <p className="text-2xl font-bold text-earth-900">{themeGrants.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <p className="text-sm text-earth-500">Potentieel</p>
          <p className="text-2xl font-bold text-earth-900">{formatAmount(totalPotential)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <p className="text-sm text-earth-500">Urgent (&lt;60 dagen)</p>
          <p className="text-2xl font-bold text-red-600">{upcomingDeadlines.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <p className="text-sm text-earth-500">Regio&apos;s</p>
          <p className="text-2xl font-bold text-earth-900">{Object.keys(regionCounts).length - 1}</p>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-gradient-to-r from-sacred-50 to-sacred-100 rounded-xl p-6 border border-sacred-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sacred-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-sacred-700" />
            </div>
            <h2 className="text-lg font-semibold text-sacred-900">Naderende Deadlines</h2>
          </div>
          <div className="grid gap-3">
            {upcomingDeadlines.map(grant => {
              const daysUntil = differenceInDays(parseISO(grant.deadline), new Date())
              return (
                <div
                  key={grant.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedGrant(grant)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className={`w-4 h-4 ${daysUntil <= 14 ? 'text-red-500' : 'text-sacred-500'}`} />
                    <span className="font-medium text-earth-800">{grant.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-earth-600">{grant.amount?.display}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      daysUntil <= 14 ? 'bg-red-100 text-red-700' : 'bg-sacred-100 text-sacred-700'
                    }`}>
                      {daysUntil === 0 ? 'Vandaag!' : `${daysUntil} dagen`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-earth-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
            <input
              type="text"
              placeholder="Zoek grants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500"
          >
            <option value="deadline">Sorteer op deadline</option>
            <option value="amount">Sorteer op bedrag</option>
            <option value="name">Sorteer op naam</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-earth-500 self-center mr-2">Regio:</span>
          {regions.filter(r => r.id === 'all' || regionCounts[r.id]).map(region => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeRegion === region.id
                  ? 'bg-sacred-600 text-white'
                  : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
              }`}
            >
              <span>{region.flag}</span>
              <span className="hidden sm:inline">{region.name}</span>
              <span className="text-xs opacity-75">({region.id === 'all' ? themeGrants.length : regionCounts[region.id] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-earth-600">
        <span className="font-semibold">{filteredGrants.length}</span> grants gevonden
      </p>

      {/* Grants Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredGrants.map(grant => (
          <GrantCard
            key={grant.id}
            grant={grant}
            onClick={() => setSelectedGrant(grant)}
            onUpdateProgress={() => {}}
            isFavorite={false}
            onToggleFavorite={() => {}}
          />
        ))}
      </div>

      {filteredGrants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-earth-600">Geen grants gevonden.</p>
        </div>
      )}

      {selectedGrant && (
        <GrantModal
          grant={selectedGrant}
          onClose={() => setSelectedGrant(null)}
          onUpdateProgress={() => {}}
          userId="local-dev-user"
        />
      )}
    </div>
  )
}
