'use client'

import { useState, useEffect } from 'react'
import { progressStages } from '@/lib/grants-data'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  X,
  ExternalLink,
  Clock,
  DollarSign,
  Building2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Save,
  Download,
  Bell
} from 'lucide-react'

export default function GrantModal({ grant, progress, onClose, onUpdateProgress, userId }) {
  const [status, setStatus] = useState(progress?.status || 'not-started')
  const [notes, setNotes] = useState(progress?.notes || '')
  const [amountRequested, setAmountRequested] = useState(progress?.amount_requested || '')
  const [amountReceived, setAmountReceived] = useState(progress?.amount_received || '')
  const [reminderDate, setReminderDate] = useState(progress?.reminder_date || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
  const handleSave = async () => {
    setSaving(true)
    await onUpdateProgress(grant.id, {
      status,
      notes,
      amount_requested: amountRequested ? parseFloat(amountRequested) : null,
      amount_received: amountReceived ? parseFloat(amountReceived) : null,
      reminder_date: reminderDate || null,
    })
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

    // Create ICS content
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

    // Download file
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${grant.id}-deadline.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className={`p-6 border-b border-earth-200 urgency-${grant.urgency}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`category-${grant.category} px-2 py-1 rounded text-sm font-medium`}>
                    {grant.entityType}
                  </span>
                  {grant.urgency === 'urgent' && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Urgent
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-serif font-bold text-earth-900">{grant.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-earth-500 hover:text-earth-700 hover:bg-earth-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-green-700">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">{grant.amount.display}</span>
              </div>
              <div className={`flex items-center gap-2 ${deadlineInfo.isPast ? 'text-earth-400' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 14 ? 'text-red-600' : 'text-earth-600'}`}>
                <Clock className="w-5 h-5" />
                <span>{deadlineInfo.text}</span>
                {deadlineInfo.daysLeft !== null && (
                  <span className={`px-2 py-0.5 rounded text-sm ${
                    deadlineInfo.daysLeft <= 7 ? 'bg-red-100 text-red-700' :
                    deadlineInfo.daysLeft <= 14 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-earth-100 text-earth-600'
                  }`}>
                    {deadlineInfo.daysLeft === 0 ? 'Today!' : `${deadlineInfo.daysLeft} days left`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Description */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-earth-500 uppercase tracking-wide mb-2">
                What is this grant?
              </h3>
              <p className="text-earth-700">{grant.description}</p>
            </section>

            {/* Why Sacred fits */}
            <section className="mb-6 p-4 bg-sacred-50 rounded-lg border border-sacred-200">
              <h3 className="text-sm font-semibold text-sacred-700 uppercase tracking-wide mb-2">
                Why Sacred Foundation Fits
              </h3>
              <p className="text-earth-700">{grant.whySacredFits}</p>
            </section>

            {/* Eligibility */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-earth-500 uppercase tracking-wide mb-2">
                Eligibility Requirements
              </h3>
              <ul className="space-y-2">
                {grant.eligibility.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-earth-700">{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Action Required */}
            <section className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-2">
                Action Required
              </h3>
              <p className="text-earth-700 font-medium">{grant.actionRequired}</p>
            </section>

            {/* Progress Tracking */}
            <section className="mb-6 p-4 bg-earth-50 rounded-lg border border-earth-200">
              <h3 className="text-sm font-semibold text-earth-700 uppercase tracking-wide mb-4">
                Track Your Progress
              </h3>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Application Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {progressStages.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => setStatus(stage.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        status === stage.id
                          ? `status-${stage.id} ring-2 ring-offset-2 ring-${stage.color}-500`
                          : 'bg-white border border-earth-300 text-earth-600 hover:bg-earth-100'
                      }`}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes, checklist items, or reminders..."
                  rows={4}
                  className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Amount Requested
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-500">$</span>
                    <input
                      type="number"
                      value={amountRequested}
                      onChange={(e) => setAmountRequested(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-500">$</span>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reminder */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Set Reminder
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-earth-300 rounded-lg focus:ring-2 focus:ring-sacred-500 focus:border-sacred-500"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 disabled:opacity-50 transition-colors"
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
            </section>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {grant.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-earth-100 text-earth-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-earth-200 bg-earth-50 flex flex-wrap gap-3">
            <a
              href={grant.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Apply Now
            </a>
            <button
              onClick={exportToCalendar}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
