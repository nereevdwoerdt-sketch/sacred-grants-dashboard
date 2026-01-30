'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Bell,
  Maximize2,
  Archive,
  Trash2,
  RotateCcw,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import ShareButton from './ShareButton'

export default function GrantModal({
  grant,
  progress,
  onClose,
  onUpdateProgress,
  userId,
  onArchive,
  onDelete,
  onRestore,
  grantStatus = 'active' // 'active', 'archived', 'deleted'
}) {
  const [status, setStatus] = useState(progress?.status || 'not-started')
  const [notes, setNotes] = useState(progress?.notes || '')
  const [amountRequested, setAmountRequested] = useState(progress?.amount_requested || '')
  const [amountReceived, setAmountReceived] = useState(progress?.amount_received || '')
  const [reminderDate, setReminderDate] = useState(progress?.reminder_date || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus trap and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on Escape
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (showActions) {
          setShowActions(false)
        } else {
          onClose()
        }
      }

      // Tab trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    // Focus the close button on open
    setTimeout(() => closeButtonRef.current?.focus(), 0)

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, showDeleteConfirm, showActions])

  const handleArchive = async () => {
    if (!onArchive) return
    setArchiving(true)
    await onArchive(grant.id)
    setArchiving(false)
    setShowActions(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    await onDelete(grant.id)
    setDeleting(false)
    setShowDeleteConfirm(false)
    setShowActions(false)
    onClose()
  }

  const handleRestore = async () => {
    if (!onRestore) return
    setArchiving(true)
    await onRestore(grant.id)
    setArchiving(false)
    onClose()
  }

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
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className={`p-6 border-b border-earth-200 urgency-${grant.urgency} flex-shrink-0 ${grantStatus !== 'active' ? 'opacity-75' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`category-${grant.category} px-2 py-1 rounded text-sm font-medium`}>
                    {grant.entityType}
                  </span>
                  {grant.urgency === 'urgent' && grantStatus === 'active' && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Urgent
                    </span>
                  )}
                  {grantStatus === 'archived' && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                      <Archive className="w-4 h-4" />
                      Archived
                    </span>
                  )}
                  {grantStatus === 'deleted' && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      Deleted
                    </span>
                  )}
                </div>
                <h2 id="modal-title" className="text-2xl font-serif font-bold text-earth-900">{grant.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Actions menu */}
                {userId && (onArchive || onDelete || onRestore) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="p-2 text-earth-500 hover:text-earth-700 hover:bg-earth-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>
                    {showActions && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-earth-200 py-1 z-10 min-w-[160px]">
                        {grantStatus === 'active' && onArchive && (
                          <button
                            onClick={handleArchive}
                            disabled={archiving}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-earth-700 hover:bg-earth-50"
                          >
                            <Archive className="w-4 h-4" />
                            {archiving ? 'Archiving...' : 'Archive'}
                          </button>
                        )}
                        {grantStatus === 'active' && onDelete && (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                        {(grantStatus === 'archived' || grantStatus === 'deleted') && onRestore && (
                          <button
                            onClick={handleRestore}
                            disabled={archiving}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {archiving ? 'Restoring...' : 'Restore'}
                          </button>
                        )}
                        {grantStatus === 'archived' && onDelete && (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete permanently
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 text-earth-500 hover:text-earth-700 hover:bg-earth-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sacred-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
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
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {/* Description */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-earth-500 uppercase tracking-wide mb-2">
                What is this grant?
              </h3>
              <p className="text-earth-700">{grant.description}</p>
            </section>

            {/* Why Sacred fits */}
            {grant.whySacredFits && (
              <section className="mb-6 p-4 bg-sacred-50 rounded-lg border border-sacred-200">
                <h3 className="text-sm font-semibold text-sacred-700 uppercase tracking-wide mb-2">
                  {grant.isDiscovered ? 'Why This Matches' : 'Why Sacred Foundation Fits'}
                </h3>
                <p className="text-earth-700">{grant.whySacredFits}</p>
              </section>
            )}

            {/* Source info for discovered grants */}
            {grant.isDiscovered && grant.sourceName && (
              <section className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
                  Source
                </h3>
                <p className="text-earth-700">
                  Discovered from <strong>{grant.sourceName}</strong>
                  {grant.relevanceScore && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                      Relevance: {grant.relevanceScore}
                    </span>
                  )}
                </p>
              </section>
            )}

            {/* Eligibility */}
            {grant.eligibility && grant.eligibility.length > 0 && (
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
            )}

            {/* Action Required */}
            {grant.actionRequired && (
              <section className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-2">
                  Action Required
                </h3>
                <p className="text-earth-700 font-medium">{grant.actionRequired}</p>
              </section>
            )}

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
          <div className="p-6 border-t border-earth-200 bg-earth-50 flex flex-wrap gap-3 flex-shrink-0">
            {grantStatus === 'active' ? (
              <>
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
                <ShareButton grant={grant} />
                <Link
                  href={`/grants/${grant.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                  Full Page
                </Link>
              </>
            ) : (
              <>
                {onRestore && (
                  <button
                    onClick={handleRestore}
                    disabled={archiving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    {archiving ? 'Restoring...' : 'Restore Grant'}
                  </button>
                )}
                {grantStatus === 'archived' && onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                )}
                <Link
                  href={`/grants/${grant.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                  Full Page
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-earth-900">Delete Grant?</h3>
                <p className="text-sm text-earth-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-earth-700 mb-6">
              Are you sure you want to permanently delete <strong>{grant.name}</strong>?
              This will remove it from your view forever.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-earth-300 rounded-lg hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
