'use client'

import { useState, useMemo } from 'react'
import { progressStages } from '@/lib/grants-data'
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react'

export default function ProgressContent({ grants, progress, userId }) {
  const [filterStatus, setFilterStatus] = useState('all')

  const progressMap = useMemo(() => {
    return progress.reduce((acc, p) => ({ ...acc, [p.grant_id]: p }), {})
  }, [progress])

  const stats = useMemo(() => {
    const statusCounts = progressStages.reduce((acc, stage) => {
      acc[stage.id] = progress.filter(p => p.status === stage.id).length
      return acc
    }, {})

    const totalRequested = progress
      .filter(p => p.amount_requested)
      .reduce((sum, p) => sum + parseFloat(p.amount_requested), 0)

    const totalReceived = progress
      .filter(p => p.amount_received)
      .reduce((sum, p) => sum + parseFloat(p.amount_received), 0)

    const inProgress = progress.filter(p =>
      ['researching', 'drafting'].includes(p.status)
    ).length

    const submitted = progress.filter(p =>
      ['submitted', 'awaiting'].includes(p.status)
    ).length

    const successful = progress.filter(p => p.status === 'successful').length

    return {
      statusCounts,
      totalRequested,
      totalReceived,
      inProgress,
      submitted,
      successful
    }
  }, [progress])

  const filteredGrants = useMemo(() => {
    if (filterStatus === 'all') {
      return progress.map(p => ({
        ...p,
        grant: grants.find(g => g.id === p.grant_id)
      })).filter(p => p.grant)
    }

    return progress
      .filter(p => p.status === filterStatus)
      .map(p => ({
        ...p,
        grant: grants.find(g => g.id === p.grant_id)
      }))
      .filter(p => p.grant)
  }, [progress, grants, filterStatus])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-900">Progress Overview</h1>
        <p className="text-earth-600 mt-1">Track your grant application progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-earth-600">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-earth-900">{stats.inProgress}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-earth-600">Submitted</span>
          </div>
          <p className="text-2xl font-bold text-earth-900">{stats.submitted}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-earth-600">Successful</span>
          </div>
          <p className="text-2xl font-bold text-earth-900">{stats.successful}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-earth-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-earth-600">Received</span>
          </div>
          <p className="text-2xl font-bold text-earth-900">
            ${stats.totalReceived.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-sacred-600 text-white'
              : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
          }`}
        >
          All ({progress.length})
        </button>
        {progressStages.filter(s => s.id !== 'not-started').map(stage => (
          <button
            key={stage.id}
            onClick={() => setFilterStatus(stage.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === stage.id
                ? `status-${stage.id}`
                : 'bg-earth-100 text-earth-700 hover:bg-earth-200'
            }`}
          >
            {stage.name} ({stats.statusCounts[stage.id] || 0})
          </button>
        ))}
      </div>

      {/* Progress List */}
      {filteredGrants.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-earth-200">
          <TrendingUp className="w-12 h-12 text-earth-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-earth-900 mb-2">No tracked grants</h3>
          <p className="text-earth-600">
            Start tracking grants from the dashboard to see your progress here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGrants.map(item => {
            const stage = progressStages.find(s => s.id === item.status)

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 border border-earth-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-earth-900">{item.grant?.name}</h3>
                      <span className={`status-${item.status} px-2 py-1 rounded text-xs font-medium`}>
                        {stage?.name}
                      </span>
                    </div>
                    <p className="text-sm text-earth-600">
                      {item.grant?.amount.display} • Deadline: {item.grant?.deadlineDisplay}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-earth-500 mt-2 line-clamp-2">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.amount_requested && (
                      <p className="text-sm text-earth-600">
                        Requested: ${parseFloat(item.amount_requested).toLocaleString()}
                      </p>
                    )}
                    {item.amount_received && (
                      <p className="text-sm text-green-600 font-medium">
                        Received: ${parseFloat(item.amount_received).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
