import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { grants, summary } from '@/lib/grants-data'

// Count approved and pending grants
const approvedGrants = grants.filter(g => g.approved === true)
const pendingGrants = grants.filter(g => g.approved === false)

export default async function DashboardLayout({ children }) {
  // Mock user for local development
  const user = {
    id: 'local-dev-user',
    email: 'dev@sacredfoundation.org'
  }

  const profile = {
    full_name: 'Sacred Foundation',
    email: 'dev@sacredfoundation.org'
  }

  return (
    <div className="min-h-screen bg-earth-50">
      <Sidebar
        user={user}
        profile={profile}
        grantCount={approvedGrants.length}
        totalPotential={summary.conservative}
        pendingCount={pendingGrants.length}
      />
      <div className="lg:pl-64">
        <Header user={user} profile={profile} />
        <main id="main-content" className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
