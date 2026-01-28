'use client'

import { useMemo } from 'react'
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export default function StatsCards({ summary, progress, grants }) {
  const stats = useMemo(() => {
    const submitted = progress.filter(p => p.status === 'submitted' || p.status === 'awaiting')
    const successful = progress.filter(p => p.status === 'successful')
    const inProgress = progress.filter(p => ['researching', 'drafting'].includes(p.status))
    const urgent = grants.filter(g => g.urgency === 'urgent')

    const totalReceived = successful.reduce((sum, p) => sum + (parseFloat(p.amount_received) || 0), 0)

    return {
      totalGrants: summary.totalGrants,
      conservative: summary.conservative,
      optimistic: summary.optimistic,
      submitted: submitted.length,
      successful: successful.length,
      inProgress: inProgress.length,
      urgent: urgent.length,
      totalReceived
    }
  }, [summary, progress, grants])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FileText}
        label="Total Grants"
        value={stats.totalGrants}
        subtext="opportunities tracked"
        color="sacred"
      />
      <StatCard
        icon={DollarSign}
        label="Potential Funding"
        value={`$${(stats.conservative / 1000).toFixed(0)}K - $${(stats.optimistic / 1000000).toFixed(1)}M`}
        subtext="estimated range"
        color="green"
      />
      <StatCard
        icon={AlertCircle}
        label="Urgent Deadlines"
        value={stats.urgent}
        subtext="within 6 weeks"
        color="red"
      />
      <StatCard
        icon={TrendingUp}
        label="In Progress"
        value={stats.inProgress}
        subtext="applications active"
        color="blue"
      />
      <StatCard
        icon={Clock}
        label="Submitted"
        value={stats.submitted}
        subtext="awaiting response"
        color="purple"
      />
      <StatCard
        icon={CheckCircle}
        label="Successful"
        value={stats.successful}
        subtext="grants received"
        color="emerald"
      />
      <StatCard
        icon={DollarSign}
        label="Received"
        value={stats.totalReceived > 0 ? `$${stats.totalReceived.toLocaleString()}` : '$0'}
        subtext="funding secured"
        color="emerald"
      />
      <StatCard
        icon={FileText}
        label="Pty Ltd Eligible"
        value={summary.ptyLtdCount}
        subtext="apply now"
        color="earth"
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colorClasses = {
    sacred: 'bg-sacred-50 text-sacred-600 border-sacred-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    earth: 'bg-earth-100 text-earth-600 border-earth-200',
  }

  const iconColors = {
    sacred: 'bg-sacred-100 text-sacred-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    earth: 'bg-earth-200 text-earth-600',
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-earth-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-earth-900">{value}</div>
      <div className="text-xs text-earth-500 mt-1">{subtext}</div>
    </div>
  )
}
