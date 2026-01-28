import { redirect } from 'next/navigation'

export default async function Home() {
  // Skip landing page, go straight to dashboard for local development
  redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-50 via-earth-100 to-sacred-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-sacred-900 mb-6">
              Sacred Foundation
            </h1>
            <p className="text-xl md:text-2xl text-earth-700 mb-4">
              Grants Dashboard
            </p>
            <p className="text-lg text-earth-600 max-w-2xl mx-auto mb-12">
              Track, manage, and collaborate on grant applications.
              Stay organized with deadlines, progress tracking, and team collaboration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-sacred-600 rounded-lg hover:bg-sacred-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-sacred-700 bg-white rounded-lg hover:bg-earth-50 transition-colors shadow-lg hover:shadow-xl border border-sacred-200"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-sacred-200 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-earth-300 rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-serif font-bold text-center text-sacred-900 mb-16">
          Everything you need to manage grants
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📊"
            title="Track Progress"
            description="Monitor every grant application from research to outcome with detailed progress tracking."
          />
          <FeatureCard
            icon="🔔"
            title="Deadline Alerts"
            description="Never miss a deadline with automatic reminders and calendar integration."
          />
          <FeatureCard
            icon="👥"
            title="Team Collaboration"
            description="Work together with your team, share notes, and coordinate applications."
          />
          <FeatureCard
            icon="☁️"
            title="Cloud Sync"
            description="Access your dashboard from any device with automatic cloud synchronization."
          />
          <FeatureCard
            icon="📄"
            title="Export Reports"
            description="Generate PDF and CSV reports for board meetings and record keeping."
          />
          <FeatureCard
            icon="🔄"
            title="Auto Updates"
            description="Stay informed with automatic notifications when grant details change."
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-sacred-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="34+" label="Grants Tracked" />
            <StatCard number="$565K" label="Conservative Est." />
            <StatCard number="$2.68M" label="Optimistic Est." />
            <StatCard number="12" label="Pty Ltd Eligible" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-earth-900 text-earth-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2026 Sacred Foundation. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-serif font-semibold text-sacred-900 mb-2">{title}</h3>
      <p className="text-earth-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold text-sacred-300 mb-2">{number}</div>
      <div className="text-earth-400">{label}</div>
    </div>
  )
}
