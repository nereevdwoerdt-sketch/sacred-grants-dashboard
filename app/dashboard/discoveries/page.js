'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  ExternalLink,
  Check,
  X,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react'

const statusColors = {
  new: 'bg-[#D39D33]/20 text-[#D39D33] border-[#D39D33]',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
  added: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-gray-100 text-gray-500 border-gray-300',
  expired: 'bg-red-100 text-red-800 border-red-300'
}

const relevanceColors = {
  high: 'bg-green-500',
  medium: 'bg-[#D39D33]',
  low: 'bg-gray-400'
}

function getRelevanceLevel(score) {
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('new')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRun, setLastRun] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    loadDiscoveries()
    loadLastRun()
  }, [filter])

  async function loadDiscoveries() {
    setLoading(true)
    let query = supabase
      .from('discovered_grants')
      .select('*')
      .order('relevance_score', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query.limit(50)

    if (!error && data) {
      setDiscoveries(data)
    }
    setLoading(false)
  }

  async function loadLastRun() {
    const { data } = await supabase
      .from('discovery_runs')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setLastRun(data)
    }
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('discovered_grants')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      if (newStatus === 'added') {
        // Remove from current list with animation
        setDiscoveries(discoveries.filter(d => d.id !== id))
      } else {
        setDiscoveries(discoveries.map(d =>
          d.id === id ? { ...d, status: newStatus } : d
        ))
      }
    }
  }

  async function triggerDiscovery() {
    setRefreshing(true)
    try {
      const response = await fetch('/api/discovery/run', {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        loadDiscoveries()
        loadLastRun()
      } else {
        console.error('Discovery failed:', result.error)
      }
    } catch (error) {
      console.error('Discovery failed:', error)
    }
    setRefreshing(false)
  }

  const filterOptions = [
    { value: 'new', label: 'New', count: discoveries.filter(d => d.status === 'new').length },
    { value: 'reviewed', label: 'Reviewed', count: 0 },
    { value: 'added', label: 'Added', count: 0 },
    { value: 'rejected', label: 'Rejected', count: 0 },
    { value: 'all', label: 'All', count: discoveries.length }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#312117] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D39D33]" />
            Grant Discoveries
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered grant discovery finds relevant opportunities from 20+ sources
          </p>
        </div>
        <button
          onClick={triggerDiscovery}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#D39D33] text-white rounded-lg hover:bg-[#b8862d] disabled:opacity-50 transition-colors"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {refreshing ? 'Discovering...' : 'Run Discovery'}
        </button>
      </div>

      {/* Stats */}
      {lastRun && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Last Run</p>
            <p className="text-lg font-semibold text-[#312117]">
              {new Date(lastRun.completed_at).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Sources Checked</p>
            <p className="text-lg font-semibold text-[#312117]">{lastRun.sources_scraped}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Grants Found</p>
            <p className="text-lg font-semibold text-[#312117]">{lastRun.grants_found}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 uppercase">Relevant Matches</p>
            <p className="text-lg font-semibold text-[#D39D33]">{lastRun.relevant_grants}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-[#312117] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Discoveries list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#D39D33]" />
        </div>
      ) : discoveries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No discoveries yet</h3>
          <p className="text-gray-500 mb-4">
            Click "Run Discovery" to scan grant databases for relevant opportunities.
          </p>
          <button
            onClick={triggerDiscovery}
            disabled={refreshing}
            className="px-4 py-2 bg-[#D39D33] text-white rounded-lg hover:bg-[#b8862d] disabled:opacity-50"
          >
            Start Discovery
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {discoveries.map((grant) => {
            const relevanceLevel = getRelevanceLevel(grant.relevance_score)
            return (
              <div
                key={grant.id}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#D39D33]/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Relevance indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${relevanceColors[relevanceLevel]} flex items-center justify-center text-white font-bold text-sm`}>
                          {grant.relevance_score}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">score</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#312117] mb-1">
                          {grant.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {grant.source_name}
                          </span>
                          {grant.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {grant.region}
                            </span>
                          )}
                          {grant.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {grant.deadline}
                            </span>
                          )}
                        </div>

                        {grant.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {grant.description}
                          </p>
                        )}

                        {/* Keyword matches */}
                        {grant.keyword_matches && (
                          <div className="flex flex-wrap gap-1">
                            {grant.keyword_matches.primary?.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                {kw}
                              </span>
                            ))}
                            {grant.keyword_matches.secondary?.slice(0, 3).map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {kw}
                              </span>
                            ))}
                            {grant.keyword_matches.geographic?.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col items-center gap-2 lg:gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[grant.status]}`}>
                      {grant.status}
                    </span>

                    <a
                      href={grant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 text-sm text-[#312117] border border-gray-200 rounded-lg hover:border-[#D39D33] hover:text-[#D39D33] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>

                    {grant.status === 'new' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(grant.id, 'added')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Add to tracked grants"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(grant.id, 'rejected')}
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Not relevant"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount and eligibility */}
                {(grant.amount || grant.eligibility) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4 text-sm">
                    {grant.amount && (
                      <div>
                        <span className="text-gray-500">Amount:</span>{' '}
                        <span className="font-medium text-[#312117]">{grant.amount}</span>
                      </div>
                    )}
                    {grant.eligibility && (
                      <div>
                        <span className="text-gray-500">Eligibility:</span>{' '}
                        <span className="text-gray-700">{grant.eligibility.substring(0, 150)}...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Discovered date */}
                <div className="mt-3 text-xs text-gray-400">
                  Discovered {new Date(grant.discovered_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
