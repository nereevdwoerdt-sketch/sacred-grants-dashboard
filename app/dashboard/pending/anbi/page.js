'use client'

import { useState, useEffect, useMemo } from 'react'
import { anbiFunds, anbiCategories } from '@/lib/anbi-review-data'
import ReviewTabs from '@/components/ReviewTabs'
import {
  Search,
  ExternalLink,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  Building2,
  MapPin,
  Globe,
  BarChart3,
  Eye,
} from 'lucide-react'

const STORAGE_KEY = 'sacred-anbi-review'

function useAnbiReview() {
  const [decisions, setDecisions] = useState({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setDecisions(JSON.parse(stored))
    } catch {}
  }, [])

  function save(next) {
    setDecisions(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function approve(rsin) {
    save({ ...decisions, [rsin]: 'approved' })
  }

  function reject(rsin) {
    save({ ...decisions, [rsin]: 'rejected' })
  }

  function maybe(rsin) {
    save({ ...decisions, [rsin]: 'maybe' })
  }

  function reset(rsin) {
    const next = { ...decisions }
    delete next[rsin]
    save(next)
  }

  function getStatus(rsin) {
    return decisions[rsin] || 'pending'
  }

  return { decisions, approve, reject, maybe, reset, getStatus }
}

const categoryOrder = ['music', 'nature', 'heritage', 'culture', 'international', 'cacao', 'film', 'wellbeing', 'talent', 'other']

export default function AnbiReviewPage() {
  const { decisions, approve, reject, maybe, reset, getStatus } = useAnbiReview()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [expandedRsin, setExpandedRsin] = useState(null)
  const [sortBy, setSortBy] = useState('score')

  const stats = useMemo(() => {
    const s = { total: anbiFunds.length, pending: 0, approved: 0, rejected: 0, maybe: 0 }
    for (const f of anbiFunds) {
      const status = getStatus(f.rsin)
      if (status === 'approved') s.approved++
      else if (status === 'rejected') s.rejected++
      else if (status === 'maybe') s.maybe++
      else s.pending++
    }
    return s
  }, [decisions])

  const categoryCounts = useMemo(() => {
    const counts = {}
    for (const f of anbiFunds) {
      counts[f.category] = (counts[f.category] || 0) + 1
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    let list = anbiFunds

    if (categoryFilter !== 'all') {
      list = list.filter(f => f.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter(f => getStatus(f.rsin) === statusFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.naam.toLowerCase().includes(q) ||
        (f.alias && f.alias.toLowerCase().includes(q)) ||
        f.plaats.toLowerCase().includes(q) ||
        f.matches.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'score') {
      list = [...list].sort((a, b) => b.score - a.score)
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.naam.localeCompare(b.naam))
    } else if (sortBy === 'plaats') {
      list = [...list].sort((a, b) => a.plaats.localeCompare(b.plaats))
    }

    return list
  }, [categoryFilter, statusFilter, search, sortBy, decisions])

  const statusStyles = {
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    maybe: 'bg-amber-50 text-amber-700 border-amber-300',
    pending: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  return (
    <div className="space-y-6">
      <ReviewTabs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#312117] flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#D39D33]" />
          ANBI Register Review
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          388 potentiële fondsen gevonden uit 54.927 ANBI-organisaties — beoordeel per stuk of ze relevant zijn
        </p>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Totaal</p>
          <p className="text-2xl font-bold text-[#312117]">{stats.total}</p>
        </div>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === 'pending' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-100 hover:border-gray-300'}`}
        >
          <p className="text-xs text-gray-500 uppercase">Te beoordelen</p>
          <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === 'approved' ? 'bg-green-50 border-green-300' : 'bg-white border-gray-100 hover:border-green-300'}`}
        >
          <p className="text-xs text-green-600 uppercase">Goedgekeurd</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </button>
        <button
          onClick={() => setStatusFilter('maybe')}
          className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === 'maybe' ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100 hover:border-amber-300'}`}
        >
          <p className="text-xs text-amber-600 uppercase">Misschien</p>
          <p className="text-2xl font-bold text-amber-600">{stats.maybe}</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border text-left transition-colors ${statusFilter === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-red-200'}`}
        >
          <p className="text-xs text-red-500 uppercase">Afgewezen</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Voortgang</span>
          <span className="text-sm text-gray-500">
            {stats.approved + stats.rejected + stats.maybe} / {stats.total} beoordeeld
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${(stats.maybe / stats.total) * 100}%` }}
          />
          <div
            className="bg-red-300 transition-all"
            style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op naam, plaats of keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D39D33] focus:ring-1 focus:ring-[#D39D33]"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D39D33]"
        >
          <option value="score">Sorteer op score</option>
          <option value="name">Sorteer op naam</option>
          <option value="plaats">Sorteer op plaats</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D39D33]"
        >
          <option value="all">Alle statussen</option>
          <option value="pending">Te beoordelen</option>
          <option value="approved">Goedgekeurd</option>
          <option value="maybe">Misschien</option>
          <option value="rejected">Afgewezen</option>
        </select>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            categoryFilter === 'all'
              ? 'bg-[#312117] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Alle ({anbiFunds.length})
        </button>
        {categoryOrder.map(catId => {
          const cat = anbiCategories[catId]
          if (!cat || !categoryCounts[catId]) return null
          return (
            <button
              key={catId}
              onClick={() => setCategoryFilter(catId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === catId
                  ? 'bg-[#D39D33] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.emoji} {cat.label} ({categoryCounts[catId]})
            </button>
          )
        })}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filtered.length} fondsen gevonden
      </p>

      {/* Fund list */}
      <div className="space-y-3">
        {filtered.map(fund => {
          const status = getStatus(fund.rsin)
          const isExpanded = expandedRsin === fund.rsin
          const cat = anbiCategories[fund.category]

          return (
            <div
              key={fund.rsin}
              className={`bg-white rounded-xl border transition-all ${
                status === 'approved' ? 'border-green-200' :
                status === 'rejected' ? 'border-red-100 opacity-60' :
                status === 'maybe' ? 'border-amber-200' :
                'border-gray-100 hover:border-[#D39D33]/30'
              }`}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Score badge */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    fund.score >= 60 ? 'bg-green-500' :
                    fund.score >= 40 ? 'bg-[#D39D33]' :
                    'bg-gray-400'
                  }`}>
                    {fund.score}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#312117] text-sm leading-tight">
                        {fund.naam}
                      </h3>
                      {fund.alias && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          ook: {fund.alias}
                        </p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full border ${statusStyles[status]}`}>
                      {status === 'approved' ? 'Goedgekeurd' :
                       status === 'rejected' ? 'Afgewezen' :
                       status === 'maybe' ? 'Misschien' : 'Nieuw'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {fund.plaats}
                    </span>
                    <span className="flex items-center gap-1">
                      {cat?.emoji} {cat?.label}
                    </span>
                  </div>

                  {/* Keyword matches */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fund.matches.split(',').map((m, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {m.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a
                          href={fund.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D39D33] hover:underline break-all"
                        >
                          {fund.website}
                        </a>
                      </div>
                      <div className="text-xs text-gray-400">
                        RSIN: {fund.rsin}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={fund.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#D39D33] hover:bg-[#D39D33]/5 rounded-lg transition-colors"
                    title="Bekijk website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setExpandedRsin(isExpanded ? null : fund.rsin)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1" />

                  {status === 'pending' ? (
                    <>
                      <button
                        onClick={() => approve(fund.rsin)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Goedkeuren"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => maybe(fund.rsin)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Misschien"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reject(fund.rsin)}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Afwijzen"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => reset(fund.rsin)}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen fondsen gevonden</h3>
          <p className="text-gray-500">
            Pas de filters aan of zoek op een andere term.
          </p>
        </div>
      )}
    </div>
  )
}
