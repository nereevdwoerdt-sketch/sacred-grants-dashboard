'use client'

import { format, differenceInDays, parseISO, isAfter } from 'date-fns'
import {
  Clock,
  DollarSign,
  Building2,
  User,
  Users,
  Award,
  ExternalLink,
  ChevronRight,
  Star
} from 'lucide-react'
import { progressStages, regions } from '@/lib/grants-data'

export default function GrantCard({ grant, progress, onClick, onUpdateProgress, isFavorite, onToggleFavorite }) {
  const getDeadlineInfo = () => {
    if (grant.deadline === 'rolling' || grant.deadline === 'various') {
      return { text: grant.deadlineDisplay, urgent: false, daysLeft: null }
    }

    const deadline = parseISO(grant.deadline)
    const today = new Date()
    const daysLeft = differenceInDays(deadline, today)
    const isPast = daysLeft < 0

    return {
      text: grant.deadlineDisplay,
      urgent: daysLeft >= 0 && daysLeft <= 14,
      daysLeft: isPast ? null : daysLeft,
      isPast
    }
  }

  const deadlineInfo = getDeadlineInfo()

  // Get region info
  const getRegionFlag = () => {
    const region = regions.find(r => r.id === grant.region)
    return region ? region.flag : '🌐'
  }

  const getCategoryIcon = () => {
    switch (grant.category) {
      case 'pty-ltd': return Building2
      case 'individual': return User
      case 'nfp': return Users
      case 'nomination': return Award
      default: return Building2
    }
  }

  const CategoryIcon = getCategoryIcon()

  const getStatusBadge = () => {
    if (!progress) return null
    const stage = progressStages.find(s => s.id === progress.status)
    if (!stage || stage.id === 'not-started') return null

    return (
      <span className={`status-${stage.id} px-2 py-1 rounded-lg text-xs font-medium`}>
        {stage.name}
      </span>
    )
  }

  return (
    <div
      className={`
        bg-white rounded-2xl border border-[#312117]/20
        hover:shadow-lg hover:border-[#D39D33] transition-all cursor-pointer
        urgency-${grant.urgency}
      `}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" title={regions.find(r => r.id === grant.region)?.name}>
                {getRegionFlag()}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium bg-[#F5F3E6] text-[#312117] border border-[#312117]/20`}>
                {grant.entityType}
              </span>
              {grant.isNew && (
                <span className="badge-new">
                  NEW
                </span>
              )}
              {getStatusBadge()}
            </div>
            <h3 className="font-serif font-semibold text-lg text-[#312117] line-clamp-2">
              {grant.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(grant.id)
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? 'text-[#D39D33] hover:text-[#b8882c]'
                    : 'text-[#d4cdb3] hover:text-[#D39D33]'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <ChevronRight className="w-5 h-5 text-[#d4cdb3] mt-1" />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#665940] line-clamp-2 mb-4">
          {grant.description}
        </p>

        {/* Quick info */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="w-4 h-4 text-[#11472C]" />
            <span className="font-medium text-[#312117]">{grant.amount.display}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-sm ${
            deadlineInfo.urgent ? 'text-red-600' : deadlineInfo.isPast ? 'text-[#d4cdb3]' : 'text-[#665940]'
          }`}>
            <Clock className="w-4 h-4" />
            <span className={deadlineInfo.urgent ? 'font-medium' : ''}>
              {deadlineInfo.text}
              {deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 14 && (
                <span className="ml-1">({deadlineInfo.daysLeft} days)</span>
              )}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {grant.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[#F5F3E6] text-[#665940] rounded-lg text-xs border border-[#312117]/10"
            >
              {tag}
            </span>
          ))}
          {grant.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-[#F5F3E6] text-[#665940] rounded-lg text-xs border border-[#312117]/10">
              +{grant.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[#F5F3E6] border-t border-[#312117]/10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#665940]">
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{grant.entityType}</span>
          </div>
          <a
            href={grant.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-[#D39D33] hover:text-[#b8882c] font-medium"
          >
            Apply <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
