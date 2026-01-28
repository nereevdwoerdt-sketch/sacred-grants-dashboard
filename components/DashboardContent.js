'use client'

import { useState, useMemo, useEffect } from 'react'
import GrantCard from './GrantCard'
import StatsCards from './StatsCards'
import GrantModal from './GrantModal'
import { format, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns'
import {
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  Star,
  Inbox,
  CheckCircle2,
  Archive,
  Sparkles
} from 'lucide-react'
import { regions } from '@/lib/grants-data'

export default function DashboardContent({
  grants,
  summary,
  categories,
  progress,
  setupSteps,
  unreadNotifications,
  userId
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeRegion, setActiveRegion] = useState('all')
  const [activeView, setActiveView] = useState('all') // 'all', 'review', 'favorites', 'archived'
  const [sortBy, setSortBy] = useState('deadline')
  const [selectedGrant, setSelectedGrant] = useState(null)
  const [grantProgress, setGrantProgress] = useState({})
  const [favorites, setFavorites] = useState([])
  const [dismissed, setDismissed] = useState([])
  const [archived, setArchived] = useState([])

  // Load progress, favorites, and dismissed from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('sacred-grant-progress')
    if (savedProgress) {
      setGrantProgress(JSON.parse(savedProgress))
    }

    const savedFavorites = localStorage.getItem('sacred-grant-favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    const savedDismissed = localStorage.getItem('sacred-grant-dismissed')
    if (savedDismissed) {
      setDismissed(JSON.parse(savedDismissed))
    }

    const savedArchived = localStorage.getItem('sacred-grant-archived')
    if (savedArchived) {
      setArchived(JSON.parse(savedArchived))
    }
  }, [])

  // Auto-archive expired grants
  useEffect(() => {
    const today = new Date()
    const expiredIds = grants
      .filter(g => {
        if (g.deadline === 'rolling' || g.deadline === 'various') return false
        const deadline = parseISO(g.deadline)
        return isBefore(deadline, today) && !archived.includes(g.id)
      })
      .map(g => g.id)

    if (expiredIds.length > 0) {
      const newArchived = [...new Set([...archived, ...expiredIds])]
      setArchived(newArchived)
      localStorage.setItem('sacred-grant-archived', JSON.stringify(newArchived))
    }
  }, [grants])

  // Get progress for a grant
  const getProgress = (grantId) => grantProgress[grantId]

  // Toggle favorite
  const toggleFavorite = (grantId) => {
    const newFavorites = favorites.includes(grantId)
      ? favorites.filter(id => id !== grantId)
      : [...favorites, grantId]
    setFavorites(newFavorites)
    localStorage.setItem('sacred-grant-favorites', JSON.stringify(newFavorites))
  }

  // Dismiss grant from review queue
  const dismissGrant = (grantId) => {
    const newDismissed = [...dismissed, grantId]
    setDismissed(newDismissed)
    localStorage.setItem('sacred-grant-dismissed', JSON.stringify(newDismissed))
  }

  // Bulk dismiss all in review queue
  const dismissAllReview = () => {
    const newGrantIds = grants.filter(g => g.isNew && !dismissed.includes(g.id)).map(g => g.id)
    const newDismissed = [...new Set([...dismissed, ...newGrantIds])]
    setDismissed(newDismissed)
    localStorage.setItem('sacred-grant-dismissed', JSON.stringify(newDismissed))
  }

  // Count grants in review queue (new and not dismissed)
  const reviewQueueCount = grants.filter(g => g.isNew && !dismissed.includes(g.id)).length

  // Filter and sort grants
  const filteredGrants = useMemo(() => {
    let result = [...grants]

    // Filter by view first
    if (activeView === 'review') {
      result = result.filter(g => g.isNew && !dismissed.includes(g.id))
    } else if (activeView === 'favorites') {
      result = result.filter(g => favorites.includes(g.id))
    } else if (activeView === 'archived') {
      result = result.filter(g => archived.includes(g.id))
    } else {
      // 'all' view excludes archived
      result = result.filter(g => !archived.includes(g.id))
    }

    // Filter by region
    if (activeRegion !== 'all') {
      result = result.filter(g => g.region === activeRegion)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.tags.some(t => t.includes(query))
      )
    }

    // Filter by category
    if (activeCategory !== 'all') {
      if (activeCategory === 'urgent') {
        result = result.filter(g => g.urgency === 'urgent')
      } else if (activeCategory === 'open') {
        const today = new Date()
        result = result.filter(g => {
          if (g.deadline === 'rolling' || g.deadline === 'various') return true
          const deadline = parseISO(g.deadline)
          return isAfter(deadline, today)
        })
      } else {
        result = result.filter(g => g.category === activeCategory)
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (a.deadline === 'rolling') return 1
        if (b.deadline === 'rolling') return -1
        if (a.deadline === 'various') return 1
        if (b.deadline === 'various') return -1
        return new Date(a.deadline) - new Date(b.deadline)
      }
      if (sortBy === 'amount') {
        return b.amount.max - a.amount.max
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

    return result
  }, [grants, searchQuery, activeCategory, activeRegion, activeView, sortBy, favorites, dismissed, archived])

  // Calculate upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const today = new Date()
    return grants
      .filter(g => {
        if (g.deadline === 'rolling' || g.deadline === 'various') return false
        const deadline = parseISO(g.deadline)
        const daysUntil = differenceInDays(deadline, today)
        return daysUntil >= 0 && daysUntil <= 30
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  }, [grants])

  // Update progress handler - uses localStorage for local dev
  const updateProgress = async (grantId, updates) => {
    const existing = grantProgress[grantId]
    const newProgress = {
      ...existing,
      id: existing?.id || `local-${grantId}`,
      grant_id: grantId,
      ...updates,
      updated_at: new Date().toISOString()
    }

    const newState = { ...grantProgress, [grantId]: newProgress }
    setGrantProgress(newState)
    localStorage.setItem('sacred-grant-progress', JSON.stringify(newState))
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Stats Overview */}
      <StatsCards
        summary={summary}
        progress={Object.values(grantProgress)}
        grants={grants}
      />

      {/* Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-gradient-to-r from-sacred-50 to-sacred-100 rounded-xl p-6 border border-sacred-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sacred-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-sacred-700" />
            </div>
            <h2 className="text-lg font-semibold text-sacred-900">Upcoming Deadlines</h2>
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
                    <Clock className={`w-4 h-4 ${daysUntil <= 7 ? 'text-red-500' : 'text-sacred-500'}`} />
                    <span className="font-medium text-earth-800">{grant.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-earth-600">{grant.amount.display}</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      daysUntil <= 7 ? 'bg-red-100 text-red-700' : 'bg-sacred-100 text-sacred-700'
                    }`}>
                      {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-200 overflow-hidden">
        <div className="flex border-b border-earth-200">
          <button
            onClick={() => setActiveView('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeView === 'all'
                ? 'bg-sacred-50 text-sacred-700 border-b-2 border-sacred-600'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <Inbox className="w-4 h-4" />
            All Tracked
          </button>
          <button
            onClick={() => setActiveView('review')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeView === 'review'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Review Queue
            {reviewQueueCount > 0 && (
              <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs">
                {reviewQueueCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('favorites')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeView === 'favorites'
                ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <Star className="w-4 h-4" />
            Favorites
            {favorites.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">
                {favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('archived')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeView === 'archived'
                ? 'bg-earth-100 text-earth-700 border-b-2 border-earth-500'
                : 'text-earth-600 hover:bg-earth-50'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
        </div>

        {/* Review Queue Actions */}
        {activeView === 'review' && reviewQueueCount > 0 && (
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <p className="text-sm text-green-700">
              <strong>{reviewQueueCount}</strong> new grants to review
            </p>
            <button
              onClick={dismissAllReview}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All Reviewed
            </button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-earth-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
            <input
              type="text"
              placeholder="Search grants by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-earth-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="amount">Sort by Amount</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Region filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-earth-500 self-center mr-2">Region:</span>
          {regions.map(region => (
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
              <span className="text-xs opacity-75">({region.count})</span>
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-earth-100">
          <span className="text-sm text-earth-500 self-center mr-2">Type:</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-sacred-600 text-white'
                  : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
          <button
            onClick={() => setActiveCategory('open')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'open'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Open Now
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-earth-600">
          Showing <span className="font-semibold">{filteredGrants.length}</span> grants
          {activeView === 'review' && ' in review queue'}
          {activeView === 'favorites' && ' in favorites'}
          {activeView === 'archived' && ' in archive'}
          {activeRegion !== 'all' && ` in ${regions.find(r => r.id === activeRegion)?.name}`}
        </p>
        {(activeCategory !== 'all' || activeRegion !== 'all') && (
          <button
            onClick={() => {
              setActiveCategory('all')
              setActiveRegion('all')
              setSearchQuery('')
            }}
            className="text-sm text-sacred-600 hover:text-sacred-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grants Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredGrants.map(grant => (
          <GrantCard
            key={grant.id}
            grant={grant}
            progress={getProgress(grant.id)}
            onClick={() => setSelectedGrant(grant)}
            onUpdateProgress={updateProgress}
            isFavorite={favorites.includes(grant.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>

      {/* No results */}
      {filteredGrants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-earth-600">No grants found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
            }}
            className="mt-4 text-sacred-600 hover:text-sacred-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grant Detail Modal */}
      {selectedGrant && (
        <GrantModal
          grant={selectedGrant}
          progress={getProgress(selectedGrant.id)}
          onClose={() => setSelectedGrant(null)}
          onUpdateProgress={updateProgress}
          userId={userId}
        />
      )}
    </div>
  )
}
