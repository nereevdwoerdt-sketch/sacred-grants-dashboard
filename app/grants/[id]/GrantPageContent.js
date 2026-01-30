'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { progressStages } from '@/lib/grants-data'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Save,
  Globe,
  Building2,
  Tag
} from 'lucide-react'
import ShareButton from '@/components/ShareButton'

const regionFlags = {
  au: '🇦🇺',
  nl: '🇳🇱',
  eu: '🇪🇺',
  pe: '🇵🇪',
  int: '🌍'
}

const regionNames = {
  au: 'Australia',
  nl: 'Netherlands',
  eu: 'European Union',
  pe: 'Peru / Latin America',
  int: 'International'
}

export default function GrantPageContent({ grant }) {
  const [status, setStatus] = useState('not-started')
  const [notes, setNotes] = useState('')
  const [amountRequested, setAmountRequested] = useState('')
  const [amountReceived, setAmountReceived] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('sacred-grant-progress')
    if (savedProgress) {
      const allProgress = JSON.parse(savedProgress)
      const progress = allProgress[grant.id]
      if (progress) {
        setStatus(progress.status || 'not-started')
        setNotes(progress.notes || '')
        setAmountRequested(progress.amount_requested || '')
        setAmountReceived(progress.amount_received || '')
        setReminderDate(progress.reminder_date || '')
      }
    }
  }, [grant.id])

  // Calculate deadline info
  const getDeadlineInfo = () => {
    if (grant.deadline === 'rolling' || grant.deadline === 'various') {
      return { text: grant.deadlineDisplay, daysLeft: null, isPast: false }
    }
    const deadline = parseISO(grant.deadline)
    const today = new Date()
    const daysLeft = differenceInDays(deadline, today)
    return {
      text: format(deadline, 'MMMM d, yyyy'),
      daysLeft: daysLeft >= 0 ? daysLeft : null,
      isPast: daysLeft < 0
    }
  }

  const deadlineInfo = getDeadlineInfo()

  // Save progress
  const handleSave = () => {
    setSaving(true)
    const savedProgress = localStorage.getItem('sacred-grant-progress')
    const allProgress = savedProgress ? JSON.parse(savedProgress) : {}

    allProgress[grant.id] = {
      status,
      notes,
      amount_requested: amountRequested ? parseFloat(amountRequested) : null,
      amount_received: amountReceived ? parseFloat(amountReceived) : null,
      reminder_date: reminderDate || null,
      updated_at: new Date().toISOString()
    }

    localStorage.setItem('sacred-grant-progress', JSON.stringify(allProgress))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Export to calendar
  const exportToCalendar = () => {
    if (grant.deadline === 'rolling' || grant.deadline === 'various') {
      alert('This grant has no fixed deadline to export.')
      return
    }

    const deadline = parseISO(grant.deadline)
    const event = {
      title: `Grant Deadline: ${grant.name}`,
      description: `${grant.description}\n\nAmount: ${grant.amount.display}\nApply: ${grant.applyUrl}`,
      startDate: format(deadline, "yyyyMMdd"),
      endDate: format(deadline, "yyyyMMdd"),
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sacred Foundation//Grants Dashboard//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:${event.startDate}
DTEND;VALUE=DATE:${event.endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
URL:${grant.applyUrl}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${grant.id}-deadline.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-earth-50">
      {/* Header */}
      <header className="bg-white border-b border-earth-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard/grants"
            className="flex items-center gap-2 text-earth-600 hover:text-earth-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Grants
          </Link>
          <div className="flex items-center gap-3">
            <ShareButton grant={grant} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Grant Header */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden mb-8 urgency-${grant.urgency}`}>
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-2xl">{regionFlags[grant.region]}</span>
              <span className={`category-${grant.category} px-3 py-1 rounded-full text-sm font-medium`}>
                {grant.entityType}
              </span>
              {grant.urgency === 'urgent' && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Urgent
                </span>
              )}
              {grant.isNew && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  NEW
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-earth-900 mb-6">
              {grant.name}
            </h1>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2 text-green-700">
                <DollarSign className="w-6 h-6" />
                <span className="text-xl font-semibold">{grant.amount.display}</span>
              </div>
              <div className={`flex items-center gap-2 ${deadlineInfo.isPast ? 'text-earth-400' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 14 ? 'text-red-600' : 'text-earth-600'}`}>
                <Clock className="w-6 h-6" />
                <span className="text-lg">{deadlineInfo.text}</span>
                {deadlineInfo.daysLeft !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    deadlineInfo.daysLeft <= 7 ? 'bg-red-100 text-red-700' :
                    deadlineInfo.daysLeft <= 14 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-earth-100 text-earth-600'
                  }`}>
                    {deadlineInfo.daysLeft === 0 ? 'Today!' : `${deadlineInfo.daysLeft} days left`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-earth-600">
                <Globe className="w-6 h-6" />
                <span>{regionNames[grant.region]}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href={grant.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Apply Now
              </a>
              <button
                onClick={exportToCalendar}
                className="flex items-center gap-2 px-6 py-3 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Add to Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-earth-900 mb-4">Share this Grant</h2>
          <ShareButton grant={grant} variant="inline" />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-earth-900 mb-4">What is this grant?</h2>
          <p className="text-earth-700 text-lg leading-relaxed">{grant.description}</p>
        </div>

        {/* Why Sacred Fits */}
        {grant.whySacredFits && (
          <div className="bg-sacred-50 rounded-2xl shadow-lg p-8 mb-8 border border-sacred-200">
            <h2 className="text-lg font-semibold text-sacred-700 mb-4">
              {grant.isDiscovered ? 'Why This Matches' : 'Why Sacred Foundation Fits'}
            </h2>
            <p className="text-earth-700 text-lg leading-relaxed">{grant.whySacredFits}</p>
          </div>
        )}

        {/* Source info for discovered grants */}
        {grant.isDiscovered && grant.sourceName && (
          <div className="bg-blue-50 rounded-2xl shadow-lg p-8 mb-8 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">Source</h2>
            <p className="text-earth-700">
              Discovered from <strong>{grant.sourceName}</strong>
              {grant.relevanceScore && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Relevance: {grant.relevanceScore}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Eligibility */}
        {grant.eligibility && grant.eligibility.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-lg font-semibold text-earth-900 mb-4">Eligibility Requirements</h2>
            <ul className="space-y-3">
              {grant.eligibility.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-earth-700 text-lg">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Required */}
        {grant.actionRequired && (
          <div className="bg-yellow-50 rounded-2xl shadow-lg p-8 mb-8 border border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-700 mb-4">Action Required</h2>
            <p className="text-earth-700 text-lg font-medium">{grant.actionRequired}</p>
          </div>
        )}

        {/* Progress Tracking */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-earth-900 mb-6">Track Your Progress</h2>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-earth-700 mb-3">
              Application Status
            </label>
            <div className="flex flex-wrap gap-2">
              {progressStages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setStatus(stage.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === stage.id
                      ? `status-${stage.id} ring-2 ring-offset-2`
                      : 'bg-earth-100 border border-earth-300 text-earth-600 hover:bg-earth-200'
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-earth-700 mb-3">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes, checklist items, or reminders..."
              rows={5}
              className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 text-lg"
            />
          </div>

          {/* Amounts */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-3">
                Amount Requested
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-500 text-lg">$</span>
                <input
                  type="number"
                  value={amountRequested}
                  onChange={(e) => setAmountRequested(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-3">
                Amount Received
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-500 text-lg">$</span>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-earth-700 mb-3">
              Set Reminder
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500 text-lg"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 disabled:opacity-50 transition-colors text-lg font-medium"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Progress
              </>
            )}
          </button>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-earth-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {grant.tags.map(tag => (
              <span
                key={tag}
                className="px-4 py-2 bg-earth-100 text-earth-600 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Source Links */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-earth-900 mb-4">Links</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href={grant.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sacred-600 hover:text-sacred-700 font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Application Page
            </a>
            {grant.sourceUrl && grant.sourceUrl !== grant.applyUrl && (
              <a
                href={grant.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sacred-600 hover:text-sacred-700 font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Source Info
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-earth-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-earth-500">
          <p>Sacred Grants Dashboard</p>
        </div>
      </footer>
    </div>
  )
}
