'use client'

import { useState, useMemo } from 'react'
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
  isBefore
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download
} from 'lucide-react'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-earth-900">Calendar</h1>
          <p className="text-earth-600 mt-1">View all grant deadlines</p>
        </div>
        <button
          onClick={exportAllDeadlines}
          className="flex items-center gap-2 px-4 py-2 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export to Calendar
        </button>
      </div>

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

        {/* Upcoming deadlines */}
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
    </div>
  )
}
