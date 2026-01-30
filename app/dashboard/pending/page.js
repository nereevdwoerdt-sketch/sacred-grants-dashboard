'use client'

import { useState, useEffect } from 'react'
import { grants as allGrants, regions, grantCategories } from '@/lib/grants-data'
import GrantModal from '@/components/GrantModal'

// Get pending grants (not yet approved)
const pendingGrants = allGrants.filter(g => g.approved === false)

export default function PendingGrantsPage() {
  const [grants, setGrants] = useState(pendingGrants)
  const [approvedIds, setApprovedIds] = useState([])
  const [rejectedIds, setRejectedIds] = useState([])
  const [selectedGrant, setSelectedGrant] = useState(null)
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load approval state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('grantApprovals')
    if (saved) {
      const { approved, rejected } = JSON.parse(saved)
      setApprovedIds(approved || [])
      setRejectedIds(rejected || [])
    }
  }, [])

  // Save approval state to localStorage
  const saveApprovals = (approved, rejected) => {
    localStorage.setItem('grantApprovals', JSON.stringify({ approved, rejected }))
  }

  const handleApprove = (grantId) => {
    const newApproved = [...approvedIds, grantId]
    const newRejected = rejectedIds.filter(id => id !== grantId)
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  const handleReject = (grantId) => {
    const newRejected = [...rejectedIds, grantId]
    const newApproved = approvedIds.filter(id => id !== grantId)
    setRejectedIds(newRejected)
    setApprovedIds(newApproved)
    saveApprovals(newApproved, newRejected)
  }

  const handleUndo = (grantId) => {
    const newApproved = approvedIds.filter(id => id !== grantId)
    const newRejected = rejectedIds.filter(id => id !== grantId)
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  const handleApproveAll = () => {
    const allIds = filteredGrants.map(g => g.id)
    const newApproved = [...new Set([...approvedIds, ...allIds])]
    const newRejected = rejectedIds.filter(id => !allIds.includes(id))
    setApprovedIds(newApproved)
    setRejectedIds(newRejected)
    saveApprovals(newApproved, newRejected)
  }

  // Filter grants
  const filteredGrants = grants.filter(grant => {
    if (filterRegion !== 'all' && grant.region !== filterRegion) return false
    if (filterCategory !== 'all' && grant.grantCategory !== filterCategory) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        grant.name.toLowerCase().includes(query) ||
        grant.description?.toLowerCase().includes(query) ||
        grant.whySacredFits?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const pendingCount = filteredGrants.filter(g => !approvedIds.includes(g.id) && !rejectedIds.includes(g.id)).length
  const approvedCount = filteredGrants.filter(g => approvedIds.includes(g.id)).length
  const rejectedCount = filteredGrants.filter(g => rejectedIds.includes(g.id)).length

  const getStatus = (grantId) => {
    if (approvedIds.includes(grantId)) return 'approved'
    if (rejectedIds.includes(grantId)) return 'rejected'
    return 'pending'
  }

  const getRegionFlag = (regionId) => {
    const region = regions.find(r => r.id === regionId)
    return region?.flag || '🌐'
  }

  const formatAmount = (amount) => {
    if (!amount) return 'Varies'
    return amount.display || `$${amount.min?.toLocaleString()} - $${amount.max?.toLocaleString()}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#312117] mb-2">
          Review Pending Grants
        </h1>
        <p className="text-[#312117]/60">
          {pendingGrants.length} nieuwe grants gevonden. Review en keur goed om ze toe te voegen aan het dashboard.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-sm text-amber-700">Te reviewen</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-sm text-green-700">Goedgekeurd</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          <div className="text-sm text-red-700">Afgewezen</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#312117]/10 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Zoek grants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
            />
          </div>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            <option value="all">Alle regio's</option>
            {regions.filter(r => r.id !== 'all').map(region => (
              <option key={region.id} value={region.id}>
                {region.flag} {region.name}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-[#312117]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D39D33]"
          >
            <option value="all">Alle categorieën</option>
            {grantCategories.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={handleApproveAll}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Keur alle gefilterde goed
          </button>
        </div>
      </div>

      {/* Grants list */}
      <div className="space-y-3">
        {filteredGrants.map(grant => {
          const status = getStatus(grant.id)
          return (
            <div
              key={grant.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                status === 'approved'
                  ? 'border-green-300 bg-green-50/50'
                  : status === 'rejected'
                  ? 'border-red-300 bg-red-50/50 opacity-60'
                  : 'border-[#312117]/10 hover:border-[#D39D33]/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Region flag */}
                <div className="text-2xl">{getRegionFlag(grant.region)}</div>

                {/* Grant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-semibold text-[#312117] cursor-pointer hover:text-[#D39D33]"
                      onClick={() => setSelectedGrant(grant)}
                    >
                      {grant.name}
                    </h3>
                    {grant.urgency === 'urgent' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Urgent
                      </span>
                    )}
                    {status === 'approved' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Goedgekeurd
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Afgewezen
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#312117]/60 line-clamp-2 mb-2">
                    {grant.whySacredFits || grant.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-[#F5F3E6] text-[#312117]/70 rounded">
                      {formatAmount(grant.amount)}
                    </span>
                    <span className="px-2 py-1 bg-[#F5F3E6] text-[#312117]/70 rounded">
                      {grant.deadlineDisplay || 'Rolling'}
                    </span>
                    <span className="px-2 py-1 bg-[#F5F3E6] text-[#312117]/70 rounded">
                      {grant.grantCategory}
                    </span>
                    {grant.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(grant.id)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Goedkeuren"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReject(grant.id)}
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
                      onClick={() => handleUndo(grant.id)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Ongedaan maken"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedGrant(grant)}
                    className="p-2 bg-[#F5F3E6] text-[#312117] rounded-lg hover:bg-[#E8E4D4] transition-colors"
                    title="Details bekijken"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredGrants.length === 0 && (
        <div className="text-center py-12 text-[#312117]/60">
          Geen grants gevonden met deze filters.
        </div>
      )}

      {/* Grant Modal */}
      {selectedGrant && (
        <GrantModal
          grant={selectedGrant}
          onClose={() => setSelectedGrant(null)}
        />
      )}
    </div>
  )
}
