'use client'

import { useState } from 'react'
import {
  CheckCircle,
  Circle,
  ExternalLink,
  FileText,
  Building2,
  Globe,
  Users,
  Banknote,
  Scale,
  Shield
} from 'lucide-react'

const setupSteps = [
  {
    id: 'abn',
    title: 'Australian Business Number (ABN)',
    description: 'Register an ABN for Sacred Pty Ltd to access Pty Ltd eligible grants',
    icon: Building2,
    link: 'https://www.abr.gov.au/',
    category: 'Pty Ltd Setup'
  },
  {
    id: 'bank',
    title: 'Business Bank Account',
    description: 'Open a business bank account for grant payments and financial tracking',
    icon: Banknote,
    link: null,
    category: 'Pty Ltd Setup'
  },
  {
    id: 'financials',
    title: 'Audited Financial Statements',
    description: 'Prepare audited financials (required for Coles Nurture Fund and others)',
    icon: FileText,
    link: null,
    category: 'Pty Ltd Setup'
  },
  {
    id: 'stichting',
    title: 'Dutch Stichting (NFP)',
    description: 'Complete the Dutch Stichting foundation setup for NFP-only grants',
    icon: Globe,
    link: null,
    category: 'NFP Setup'
  },
  {
    id: 'dgr',
    title: 'DGR Status Application',
    description: 'Apply for Deductible Gift Recipient status via the Dutch Stichting',
    icon: Scale,
    link: 'https://www.ato.gov.au/non-profit/getting-started/getting-endorsed/is-your-organisation-eligible-for-dgr-endorsement-/',
    category: 'NFP Setup'
  },
  {
    id: 'acnc',
    title: 'ACNC Registration',
    description: 'Register with the Australian Charities and Not-for-profits Commission',
    icon: Shield,
    link: 'https://www.acnc.gov.au/',
    category: 'NFP Setup'
  },
  {
    id: 'board',
    title: 'Board Structure',
    description: 'Establish a proper board of directors/trustees for governance',
    icon: Users,
    link: null,
    category: 'Governance'
  },
  {
    id: 'policies',
    title: 'Governance Policies',
    description: 'Create required policies (conflict of interest, financial management, etc.)',
    icon: FileText,
    link: null,
    category: 'Governance'
  }
]

export default function SetupPage() {
  const [completedSteps, setCompletedSteps] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sacred-setup-steps')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const newSteps = prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]

      if (typeof window !== 'undefined') {
        localStorage.setItem('sacred-setup-steps', JSON.stringify(newSteps))
      }
      return newSteps
    })
  }

  const categories = [...new Set(setupSteps.map(s => s.category))]
  const progress = (completedSteps.length / setupSteps.length) * 100

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-earth-900">Setup Steps</h1>
        <p className="text-earth-600 mt-1">
          Complete these steps to maximize your grant eligibility
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-earth-700">Overall Progress</span>
          <span className="text-sm font-medium text-sacred-600">
            {completedSteps.length} of {setupSteps.length} completed
          </span>
        </div>
        <div className="h-3 bg-earth-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sacred-500 to-sacred-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps by Category */}
      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h2 className="text-lg font-semibold text-earth-900">{category}</h2>

          <div className="space-y-3">
            {setupSteps
              .filter(s => s.category === category)
              .map(step => {
                const isCompleted = completedSteps.includes(step.id)
                const Icon = step.icon

                return (
                  <div
                    key={step.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-earth-200 hover:border-sacred-300'
                    }`}
                    onClick={() => toggleStep(step.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-green-100' : 'bg-earth-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isCompleted ? 'text-green-600' : 'text-earth-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-medium ${
                              isCompleted ? 'text-green-800' : 'text-earth-900'
                            }`}>
                              {step.title}
                            </h3>
                            <p className="text-sm text-earth-600 mt-1">
                              {step.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {step.link && (
                              <a
                                href={step.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 text-sacred-600 hover:bg-sacred-50 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-earth-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      {/* Completion Message */}
      {progress === 100 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">All Set!</h2>
          <p className="opacity-90">
            You've completed all setup steps. You're now eligible for all tracked grants!
          </p>
        </div>
      )}
    </div>
  )
}
