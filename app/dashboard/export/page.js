'use client'

import { useState } from 'react'
import { grants, summary, progressStages } from '@/lib/grants-data'
import { format } from 'date-fns'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  CheckCircle
} from 'lucide-react'

export default function ExportPage() {
  const [exporting, setExporting] = useState(null)

  const exportToCSV = () => {
    setExporting('csv')

    const headers = [
      'Name',
      'Category',
      'Entity Type',
      'Amount Min',
      'Amount Max',
      'Amount Display',
      'Deadline',
      'Urgency',
      'Description',
      'Why Sacred Fits',
      'Eligibility',
      'Action Required',
      'Apply URL',
      'Tags'
    ]

    const rows = grants.map(g => [
      g.name,
      g.category,
      g.entityType,
      g.amount.min,
      g.amount.max,
      g.amount.display,
      g.deadlineDisplay,
      g.urgency,
      g.description,
      g.whySacredFits,
      g.eligibility.join('; '),
      g.actionRequired,
      g.applyUrl,
      g.tags.join(', ')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sacred-grants-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    setTimeout(() => setExporting(null), 1000)
  }

  const exportToPDF = async () => {
    setExporting('pdf')

    // Dynamic import for PDF library
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()

    // Title
    doc.setFontSize(24)
    doc.setTextColor(107, 51, 36) // Sacred brown
    doc.text('Sacred Foundation', 20, 20)

    doc.setFontSize(16)
    doc.setTextColor(100, 100, 100)
    doc.text('Grants Dashboard Report', 20, 30)

    doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 38)

    // Summary stats
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Summary', 20, 50)

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: [
        ['Total Grants', summary.totalGrants.toString()],
        ['Conservative Estimate', `$${summary.conservative.toLocaleString()}`],
        ['Optimistic Estimate', `$${summary.optimistic.toLocaleString()}`],
        ['Pty Ltd Eligible', summary.ptyLtdCount.toString()],
        ['NFP Required', summary.nfpCount.toString()],
        ['Individual/Artist', summary.individualCount.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [212, 117, 61] },
      styles: { fontSize: 9 }
    })

    // Grants table
    doc.addPage()
    doc.setFontSize(12)
    doc.text('All Grants', 20, 20)

    const tableData = grants.map(g => [
      g.name,
      g.entityType,
      g.amount.display,
      g.deadlineDisplay,
      g.urgency
    ])

    autoTable(doc, {
      startY: 25,
      head: [['Grant Name', 'Entity Type', 'Amount', 'Deadline', 'Urgency']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 117, 61] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 }
      }
    })

    // Urgent grants detail
    const urgentGrants = grants.filter(g => g.urgency === 'urgent')
    if (urgentGrants.length > 0) {
      doc.addPage()
      doc.setFontSize(12)
      doc.setTextColor(220, 38, 38)
      doc.text('URGENT GRANTS', 20, 20)

      let yPos = 30
      urgentGrants.forEach(g => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(g.name, 20, yPos)

        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${g.amount.display} | Deadline: ${g.deadlineDisplay}`, 20, yPos + 5)
        doc.text(`Action: ${g.actionRequired}`, 20, yPos + 10)

        yPos += 20
      })
    }

    doc.save(`sacred-grants-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)

    setTimeout(() => setExporting(null), 1000)
  }

  const exportCalendar = () => {
    setExporting('calendar')

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

    setTimeout(() => setExporting(null), 1000)
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-900">Export Data</h1>
        <p className="text-earth-600 mt-1">
          Download your grants data in various formats
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* CSV Export */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-earth-900">CSV Spreadsheet</h3>
              <p className="text-sm text-earth-500">Excel/Google Sheets compatible</p>
            </div>
          </div>
          <p className="text-earth-600 text-sm mb-4">
            Export all grant data to a CSV file that can be opened in Excel, Google Sheets, or any spreadsheet application.
          </p>
          <button
            onClick={exportToCSV}
            disabled={exporting === 'csv'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {exporting === 'csv' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download CSV
              </>
            )}
          </button>
        </div>

        {/* PDF Export */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-earth-900">PDF Report</h3>
              <p className="text-sm text-earth-500">Printable document</p>
            </div>
          </div>
          <p className="text-earth-600 text-sm mb-4">
            Generate a formatted PDF report with summary statistics and all grants. Perfect for board meetings or printing.
          </p>
          <button
            onClick={exportToPDF}
            disabled={exporting === 'pdf'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {exporting === 'pdf' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Calendar Export */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-earth-900">Calendar File</h3>
              <p className="text-sm text-earth-500">ICS format for all calendars</p>
            </div>
          </div>
          <p className="text-earth-600 text-sm mb-4">
            Export all grant deadlines to a calendar file. Import into Google Calendar, Apple Calendar, or Outlook.
          </p>
          <button
            onClick={exportCalendar}
            disabled={exporting === 'calendar'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {exporting === 'calendar' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Calendar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Stats */}
      <div className="bg-earth-50 rounded-xl p-6 border border-earth-200">
        <h3 className="font-semibold text-earth-900 mb-4">What's Included</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-sacred-600">{grants.length}</p>
            <p className="text-sm text-earth-600">Total grants</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-sacred-600">
              {grants.filter(g => g.urgency === 'urgent').length}
            </p>
            <p className="text-sm text-earth-600">Urgent deadlines</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-sacred-600">
              {grants.filter(g => g.deadline !== 'rolling' && g.deadline !== 'various').length}
            </p>
            <p className="text-sm text-earth-600">Calendar events</p>
          </div>
        </div>
      </div>
    </div>
  )
}
