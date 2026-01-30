'use client'

import { useState, useMemo, useEffect } from 'react'
import { grants } from '@/lib/grants-data'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isAfter,
  isBefore,
  differenceInDays
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Grid,
  List,
  Clock
} from 'lucide-react'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile and set initial view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setViewMode('list')
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getGrantsForDay = (day) => {
    return grants.filter(g => {
      if (g.deadline === 'rolling' || g.deadline === 'various') return false
      try {
        const deadline = parseISO(g.deadline)
        return isSameDay(deadline, day)
      } catch {
        return false
      }
    })
  }

  const upcomingGrants = useMemo(() => {
    const today = new Date()
    const threeMonths = addMonths(today, 3)

    return grants
      .filter(g => {
        if (g.deadline === 'rolling' || g.deadline === 'various') return false
        try {
          const deadline = parseISO(g.deadline)
          return isAfter(deadline, today) && isBefore(deadline, threeMonths)
        } catch {
          return false
        }
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  }, [])

  // Group grants by month for list view
  const grantsByMonth = useMemo(() => {
    const today = new Date()
    const grouped = {}

    grants.forEach(g => {
      if (g.deadline === 'rolling' || g.deadline === 'various') return
      try {
        const deadline = parseISO(g.deadline)
        if (isBefore(deadline, today)) return
        const monthKey = format(deadline, 'yyyy-MM')
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            label: format(deadline, 'MMMM yyyy'),
            grants: []
          }
        }
        grouped[monthKey].grants.push(g)
      } catch {
        return
      }
    })

    // Sort grants within each month by deadline
    Object.values(grouped).forEach(month => {
      month.grants.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    })

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [])

  const exportAllDeadlines = () => {
    const grantsWithDeadlines = grants.filter(g =>
      g.deadline !== 'rolling' && g.deadline !== 'various'
    )

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sacred Foundation//Grants Dashboard//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Sacred Foundation Grant Deadlines
`

    grantsWithDeadlines.forEach(g => {
      const deadline = new Date(g.deadline)
      const dateStr = format(deadline, 'yyyyMMdd')

      icsContent += `BEGIN:VEVENT
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:Grant Deadline: ${g.name}
DESCRIPTION:Amount: ${g.amount.display}\\nEntity: ${g.entityType}\\nAction: ${g.actionRequired}\\nApply: ${g.applyUrl}
URL:${g.applyUrl}
STATUS:CONFIRMED
END:VEVENT
`
    })

    icsContent += 'END:VCALENDAR'

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sacred-grant-deadlines.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const firstDayOfMonth = startOfMonth(currentMonth).getDay()

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">Calendar</h1>
          <p className="text-earth-600 mt-1">View all grant deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle - only show on larger screens */}
          <div className="hidden md:flex items-center gap-1 bg-earth-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              title="Calendar view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={exportAllDeadlines}
            className="flex items-center gap-2 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export to Calendar</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* List View - Mobile first, shows on mobile always or when selected on desktop */}
      {(viewMode === 'list' || isMobile) && (
        <div className="bg-white rounded-xl shadow-sm border border-earth-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-earth-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sacred-600" />
            All Upcoming Deadlines
          </h2>

          {grantsByMonth.length === 0 ? (
            <p className="text-earth-500 text-center py-8">No upcoming deadlines</p>
          ) : (
            <div className="space-y-6">
              {grantsByMonth.map(([monthKey, { label, grants: monthGrants }]) => (
                <div key={monthKey}>
                  <h3 className="text-sm font-semibold text-earth-500 uppercase tracking-wide mb-3 sticky top-0 bg-white py-1">
                    {label}
                  </h3>
                  <div className="space-y-2">
                    {monthGrants.map(g => {
                      const daysUntil = differenceInDays(parseISO(g.deadline), new Date())
                      return (
                        <div
                          key={g.id}
                          className={`p-3 sm:p-4 rounded-lg border-l-4 bg-earth-50 ${
                            g.urgency === 'urgent' ? 'border-red-500' :
                            g.urgency === 'high' ? 'border-yellow-500' :
                            'border-sacred-500'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-earth-900 truncate">{g.name}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-earth-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {g.deadlineDisplay}
                                </span>
                                <span className="text-earth-400">•</span>
                                <span className="text-green-600 font-medium">{g.amount.display}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                daysUntil <= 7 ? 'bg-red-100 text-red-700' :
                                daysUntil <= 14 ? 'bg-yellow-100 text-yellow-700' :
                                daysUntil <= 30 ? 'bg-sacred-100 text-sacred-700' :
                                'bg-earth-200 text-earth-600'
                              }`}>
                                {daysUntil === 0 ? 'Today!' :
                                 daysUntil === 1 ? 'Tomorrow' :
                                 `${daysUntil} days`}
                              </span>
                              <span className="text-xs px-2 py-1 bg-earth-200 text-earth-600 rounded">
                                {g.entityType}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid View - Only on desktop when selected */}
      {viewMode === 'grid' && !isMobile && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-earth-200 p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-earth-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-earth-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-earth-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-earth-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1" />
              ))}

              {/* Days of the month */}
              {days.map(day => {
                const dayGrants = getGrantsForDay(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 p-1 border rounded-lg ${
                      isToday ? 'border-sacred-500 bg-sacred-50' : 'border-earth-200'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-sacred-700' : 'text-earth-700'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {dayGrants.map(g => (
                        <div
                          key={g.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            g.urgency === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-sacred-100 text-sacred-700'
                          }`}
                          title={g.name}
                        >
                          {g.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming deadlines sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-earth-200 p-6">
            <h3 className="text-lg font-semibold text-earth-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sacred-600" />
              Upcoming Deadlines
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {upcomingGrants.length === 0 ? (
                <p className="text-earth-500 text-sm">No upcoming deadlines</p>
              ) : (
                upcomingGrants.map(g => (
                  <div key={g.id} className="p-3 bg-earth-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-earth-900 text-sm">{g.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        g.urgency === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-earth-200 text-earth-600'
                      }`}>
                        {g.deadlineDisplay}
                      </span>
                    </div>
                    <p className="text-xs text-earth-500 mt-1">{g.amount.display}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
