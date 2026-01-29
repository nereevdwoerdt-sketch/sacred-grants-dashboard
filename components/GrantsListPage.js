'use client'

import { useState, useMemo, useEffect } from 'react'
import GrantCard from './GrantCard'
import GrantModal from './GrantModal'
import { parseISO, isAfter, format } from 'date-fns'
import {
  Search,
  Filter,
  Grid,
  List,
  Download
} from 'lucide-react'

export default function GrantsListPage({ grants, categories, progress, userId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedGrant, setSelectedGrant] = useState(null)
  const [grantProgress, setGrantProgress] = useState({})

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sacred-grant-progress')
    if (saved) {
      setGrantProgress(JSON.parse(saved))
    }
  }, [])

  const getProgress = (grantId) => grantProgress[grantId]

  const filteredGrants = useMemo(() => {
    let result = [...grants]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.tags.some(t => t.includes(query))
      )
    }

    if (activeCategory !== 'all') {
      if (activeCategory === 'urgent') {
        result = result.filter(g => g.urgency === 'urgent')
      } else if (activeCategory === 'discovered') {
        result = result.filter(g => g.isDiscovered === true)
      } else {
        result = result.filter(g => g.category === activeCategory)
      }
    }

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
  }, [grants, searchQuery, activeCategory, sortBy])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">All Grants</h1>
          <p className="text-earth-600 mt-1">
            Browse and track all available grant opportunities
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-earth-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
            <input
              type="text"
              placeholder="Search grants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
            />
          </div>

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

          <div className="flex items-center gap-1 bg-earth-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-sacred-600 text-white'
                  : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-earth-600">
          Showing <span className="font-semibold">{filteredGrants.length}</span> grants
        </p>
      </div>

      {/* Grants */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGrants.map(grant => (
            <GrantCard
              key={grant.id}
              grant={grant}
              progress={getProgress(grant.id)}
              onClick={() => setSelectedGrant(grant)}
              onUpdateProgress={updateProgress}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGrants.map(grant => (
            <div
              key={grant.id}
              onClick={() => setSelectedGrant(grant)}
              className={`bg-white rounded-lg p-4 shadow-sm border border-earth-200 hover:shadow-md cursor-pointer urgency-${grant.urgency}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`category-${grant.category} px-2 py-1 rounded text-xs font-medium`}>
                    {grant.entityType}
                  </span>
                  <h3 className="font-semibold text-earth-900">{grant.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">{grant.amount.display}</span>
                  <span className="text-earth-500">{grant.deadlineDisplay}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
