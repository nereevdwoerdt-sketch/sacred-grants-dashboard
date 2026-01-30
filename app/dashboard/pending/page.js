'use client'

import { useState, useEffect } from 'react'
import { grants as allGrants, regions, grantCategories } from '@/lib/grants-data'
import Link from 'next/link'

// Get pending grants (not yet approved)
const pendingGrants = allGrants.filter(g => g.approved === false)

// Entity types for eligibility filtering
const entityTypes = [
  { id: 'all', name: 'Alle types' },
  { id: 'pty-ltd', name: 'Pty Ltd (Sacred Taste)', color: 'bg-blue-100 text-blue-700' },
  { id: 'nfp', name: 'NFP/Stichting', color: 'bg-purple-100 text-purple-700' },
  { id: 'individual', name: 'Individual/Artist', color: 'bg-pink-100 text-pink-700' },
]

// Review status filter
const statusFilters = [
  { id: 'all', name: 'Alle' },
  { id: 'pending', name: 'Te reviewen' },
  { id: 'approved', name: 'Goedgekeurd' },
  { id: 'rejected', name: 'Afgewezen' },
]

export default function PendingGrantsPage() {
  const [approvedIds, setApprovedIds] = useState([])
  const [rejectedIds, setRejectedIds] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('priority') // priority, amount, deadline

  // Load approval state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('grantApprovals')
      if (saved) {
        const data = JSON.parse(saved)
        setApprovedIds(data.approved || [])
        setRejectedIds(data.rejected || [])
      }
    } catch (e) {
      console.error('Error loading approvals:', e)
    }
  }, [])

  // Save approval state
  const saveApprovals = (approved, rejected) => {
    try {
      localStorage.setItem('grantApprovals', JSON.stringify({ approved, rejected }))
    } catch (e) {
      console.error('Error saving approvals:', e)
    }
  }

  const handleApprove = (grantId, e) => {
    e?.stopPropagation()
    const newApproved = [...approvedIds.filter(id => id !== grantId), grantId]
    const newRejected = rejectedIds.filter(id => id !== grantId)
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  const handleReject = (grantId, e) => {
    e?.stopPropagation()
    const newRejected = [...rejectedIds.filter(id => id !== grantId), grantId]
    const newApproved = approvedIds.filter(id => id !== grantId)
    setRejectedIds(newRejected)
    setApprovedIds(newApproved)
    saveApprovals(newApproved, newRejected)
  }

  const handleUndo = (grantId, e) => {
    e?.stopPropagation()
    const newApproved = approvedIds.filter(id => id !== grantId)
    const newRejected = rejectedIds.filter(id => id !== grantId)
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  const getStatus = (grantId) => {
    if (approvedIds.includes(grantId)) return 'approved'
    if (rejectedIds.includes(grantId)) return 'rejected'
    return 'pending'
  }

  // Filter grants
  const filteredGrants = pendingGrants.filter(grant => {
    // Region filter
    if (filterRegion !== 'all' && grant.region !== filterRegion) return false

    // Category filter
    if (filterCategory !== 'all' && grant.grantCategory !== filterCategory) return false

    // Entity type filter (for eligibility)
    if (filterEntity !== 'all' && grant.category !== filterEntity) return false

    // Status filter
    const status = getStatus(grant.id)
    if (filterStatus !== 'all' && status !== filterStatus) return false

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        grant.name.toLowerCase().includes(query) ||
        grant.description?.toLowerCase().includes(query) ||
        grant.whySacredFits?.toLowerCase().includes(query) ||
        grant.entityType?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Sort grants
  const sortedGrants = [...filteredGrants].sort((a, b) => {
    if (sortBy === 'priority') {
      // Priority tags first, then urgent
      const aPriority = a.tags?.includes('top-priority') ? 3 : a.tags?.includes('priority') ? 2 : a.urgency === 'urgent' ? 1 : 0
      const bPriority = b.tags?.includes('top-priority') ? 3 : b.tags?.includes('priority') ? 2 : b.urgency === 'urgent' ? 1 : 0
      return bPriority - aPriority
    }
    if (sortBy === 'amount') {
      return (b.amount?.max || 0) - (a.amount?.max || 0)
    }
    if (sortBy === 'deadline') {
      if (!a.deadline || a.deadline === 'rolling') return 1
      if (!b.deadline || b.deadline === 'rolling') return -1
      return new Date(a.deadline) - new Date(b.deadline)
    }
    return 0
  })

  // Stats
  const totalPending = pendingGrants.filter(g => getStatus(g.id) === 'pending').length
  const totalApproved = pendingGrants.filter(g => getStatus(g.id) === 'approved').length
  const totalRejected = pendingGrants.filter(g => getStatus(g.id) === 'rejected').length

  // Batch actions
  const handleApproveAllVisible = () => {
    const ids = sortedGrants.filter(g => getStatus(g.id) === 'pending').map(g => g.id)
    const newApproved = [...new Set([...approvedIds, ...ids])]
    const newRejected = rejectedIds.filter(id => !ids.includes(id))
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  const handleRejectAllVisible = () => {
    const ids = sortedGrants.filter(g => getStatus(g.id) === 'pending').map(g => g.id)
    const newRejected = [...new Set([...rejectedIds, ...ids])]
    const newApproved = approvedIds.filter(id => !ids.includes(id))
    setRejectedIds(newRejected)
    setApprovedIds(newApproved)
    saveApprovals(newApproved, newRejected)
  }

  const getRegionInfo = (regionId) => {
    return regions.find(r => r.id === regionId) || { flag: '🌐', name: 'Unknown' }
  }

  const getEntityColor = (category) => {
    const entity = entityTypes.find(e => e.id === category)
    return entity?.color || 'bg-gray-100 text-gray-700'
  }

  const formatAmount = (amount) => {
    if (!amount) return 'Varies'
    return amount.display || `€${amount.min?.toLocaleString()} - €${amount.max?.toLocaleString()}`
  }

  // Check if grant is eligible for Sacred (Pty Ltd or has NFP path)
  const getEligibilityInfo = (grant) => {
    if (grant.category === 'pty-ltd') {
      return { eligible: true, text: 'Sacred Taste Pty Ltd eligible', color: 'text-green-600' }
    }
    if (grant.category === 'nfp') {
      return { eligible: false, text: 'Requires NFP/Stichting', color: 'text-amber-600' }
    }
    if (grant.category === 'individual') {
      return { eligible: false, text: 'Individual/Artist only', color: 'text-purple-600' }
    }
    return { eligible: true, text: 'Check eligibility', color: 'text-gray-600' }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#312117] mb-2">
          Review Nieuwe Grants
        </h1>
        <p className="text-[#312117]/60">
          {pendingGrants.length} grants gevonden door de discovery engine. Review en keur goed voor het dashboard.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#312117]/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-[#312117]">{pendingGrants.length}</div>
          <div className="text-sm text-[#312117]/60">Totaal gevonden</div>
        </div>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`text-left rounded-xl p-4 transition-all ${filterStatus === 'pending' ? 'bg-amber-100 border-2 border-amber-400' : 'bg-amber-50 border border-amber-200'}`}
        >
          <div className="text-2xl font-bold text-amber-600">{totalPending}</div>
          <div className="text-sm text-amber-700">Te reviewen</div>
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`text-left rounded-xl p-4 transition-all ${filterStatus === 'approved' ? 'bg-green-100 border-2 border-green-400' : 'bg-green-50 border border-green-200'}`}
        >
          <div className="text-2xl font-bold text-green-600">{totalApproved}</div>
          <div className="text-sm text-green-700">Goedgekeurd</div>
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`text-left rounded-xl p-4 transition-all ${filterStatus === 'rejected' ? 'bg-red-100 border-2 border-red-400' : 'bg-red-50 border border-red-200'}`}
        >
          <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
          <div className="text-sm text-red-700">Afgewezen</div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#312117]/10 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Zoek op naam, beschrijving, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
            />
          </div>

          {/* Region */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            <option value="all">Alle regio's</option>
            {regions.filter(r => r.id !== 'all').map(region => (
              <option key={region.id} value={region.id}>
                {region.flag} {region.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            <option value="all">Alle categorieën</option>
            {grantCategories.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Entity Type (Eligibility) */}
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-3 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            {entityTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            <option value="priority">Prioriteit</option>
            <option value="amount">Hoogste bedrag</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>

        {/* Batch actions */}
        <div className="flex items-center justify-between border-t border-[#312117]/10 pt-3">
          <div className="text-sm text-[#312117]/60">
            {sortedGrants.length} grants in huidige filter
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className="px-3 py-1.5 text-sm text-[#312117] hover:bg-[#F5F3E6] rounded-lg transition-colors"
            >
              Toon alle
            </button>
            <button
              onClick={handleApproveAllVisible}
              disabled={sortedGrants.filter(g => getStatus(g.id) === 'pending').length === 0}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keur zichtbare goed ({sortedGrants.filter(g => getStatus(g.id) === 'pending').length})
            </button>
            <button
              onClick={handleRejectAllVisible}
              disabled={sortedGrants.filter(g => getStatus(g.id) === 'pending').length === 0}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Wijs zichtbare af
            </button>
          </div>
        </div>
      </div>

      {/* Grants list */}
      <div className="space-y-3">
        {sortedGrants.map(grant => {
          const status = getStatus(grant.id)
          const regionInfo = getRegionInfo(grant.region)
          const eligibility = getEligibilityInfo(grant)
          const isExpanded = expandedId === grant.id

          return (
            <div
              key={grant.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                status === 'approved'
                  ? 'border-green-300 bg-green-50/30'
                  : status === 'rejected'
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-[#312117]/10 hover:border-[#D39D33]/50'
              }`}
            >
              {/* Main row - always visible */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : grant.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Region flag */}
                  <div className="text-2xl shrink-0" title={regionInfo.name}>
                    {regionInfo.flag}
                  </div>

                  {/* Grant info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[#312117]">
                        {grant.name}
                      </h3>

                      {/* Status badges */}
                      {status === 'approved' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Goedgekeurd
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Afgewezen
                        </span>
                      )}
                      {grant.urgency === 'urgent' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Urgent
                        </span>
                      )}
                      {grant.tags?.includes('top-priority') && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          Top Priority
                        </span>
                      )}
                    </div>

                    {/* Quick info line */}
                    <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEntityColor(grant.category)}`}>
                        {grant.entityType || grant.category}
                      </span>
                      <span className="text-[#312117]/70">•</span>
                      <span className="text-[#312117]/70 font-medium">{formatAmount(grant.amount)}</span>
                      <span className="text-[#312117]/70">•</span>
                      <span className="text-[#312117]/70">{grant.deadlineDisplay || 'Rolling'}</span>
                      <span className={`ml-auto text-xs ${eligibility.color}`}>
                        {eligibility.text}
                      </span>
                    </div>

                    {/* Description preview */}
                    <p className="text-sm text-[#312117]/60 line-clamp-2">
                      {grant.whySacredFits || grant.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'pending' ? (
                      <>
                        <button
                          onClick={(e) => handleApprove(grant.id, e)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Goedkeuren"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleReject(grant.id, e)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Afwijzen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => handleUndo(grant.id, e)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Ongedaan maken"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}

                    {/* Expand indicator */}
                    <div className={`p-2 text-[#312117]/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#312117]/10 bg-[#FDFCF8]">
                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    {/* Left column */}
                    <div>
                      <h4 className="font-semibold text-[#312117] mb-2">Waarom Sacred past</h4>
                      <p className="text-sm text-[#312117]/70 mb-4">
                        {grant.whySacredFits || 'Geen specifieke match beschrijving.'}
                      </p>

                      <h4 className="font-semibold text-[#312117] mb-2">Beschrijving</h4>
                      <p className="text-sm text-[#312117]/70 mb-4">
                        {grant.description}
                      </p>

                      {grant.actionRequired && (
                        <>
                          <h4 className="font-semibold text-[#312117] mb-2">Actie vereist</h4>
                          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
                            {grant.actionRequired}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Right column */}
                    <div>
                      <h4 className="font-semibold text-[#312117] mb-2">Eligibility vereisten</h4>
                      {grant.eligibility && grant.eligibility.length > 0 ? (
                        <ul className="text-sm text-[#312117]/70 space-y-1 mb-4">
                          {grant.eligibility.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#D39D33] mt-0.5">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#312117]/50 mb-4">Geen specifieke vereisten vermeld.</p>
                      )}

                      <h4 className="font-semibold text-[#312117] mb-2">Details</h4>
                      <div className="text-sm space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-[#312117]/60">Bedrag:</span>
                          <span className="font-medium">{formatAmount(grant.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#312117]/60">Deadline:</span>
                          <span className="font-medium">{grant.deadlineDisplay || 'Rolling'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#312117]/60">Entity type:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEntityColor(grant.category)}`}>
                            {grant.entityType || grant.category}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#312117]/60">Categorie:</span>
                          <span className="font-medium">{grant.grantCategory}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {grant.tags && grant.tags.length > 0 && (
                        <>
                          <h4 className="font-semibold text-[#312117] mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {grant.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-[#F5F3E6] text-[#312117]/70 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Links */}
                      <div className="flex gap-2 mt-4">
                        {grant.applyUrl && (
                          <a
                            href={grant.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-[#D39D33] text-white text-center text-sm font-medium rounded-lg hover:bg-[#B8862D] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Bekijk aanvraag
                          </a>
                        )}
                        <Link
                          href={`/grants/${grant.id}`}
                          className="px-4 py-2 border border-[#312117]/20 text-[#312117] text-sm font-medium rounded-lg hover:bg-[#F5F3E6] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Volledige pagina
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sortedGrants.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#312117]/10">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold text-[#312117] mb-2">Geen grants gevonden</h3>
          <p className="text-[#312117]/60 mb-4">
            Probeer andere filters of zoektermen.
          </p>
          <button
            onClick={() => {
              setFilterRegion('all')
              setFilterCategory('all')
              setFilterEntity('all')
              setFilterStatus('all')
              setSearchQuery('')
            }}
            className="px-4 py-2 bg-[#D39D33] text-white rounded-lg hover:bg-[#B8862D] transition-colors"
          >
            Reset alle filters
          </button>
        </div>
      )}

      {/* Quick stats footer */}
      <div className="mt-6 p-4 bg-[#F5F3E6] rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div>
            <span className="font-semibold text-[#312117]">Quick filter op eligibility:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterEntity('pty-ltd')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterEntity === 'pty-ltd' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              Pty Ltd ({pendingGrants.filter(g => g.category === 'pty-ltd').length})
            </button>
            <button
              onClick={() => setFilterEntity('nfp')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterEntity === 'nfp' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            >
              NFP/Stichting ({pendingGrants.filter(g => g.category === 'nfp').length})
            </button>
            <button
              onClick={() => setFilterEntity('individual')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterEntity === 'individual' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
            >
              Individual ({pendingGrants.filter(g => g.category === 'individual').length})
            </button>
            <button
              onClick={() => setFilterEntity('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterEntity === 'all' ? 'bg-[#312117] text-white' : 'bg-white text-[#312117] hover:bg-gray-100'}`}
            >
              Alle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
