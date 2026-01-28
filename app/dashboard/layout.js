import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

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
      <Sidebar user={user} profile={profile} />
      <div className="lg:pl-64">
        <Header user={user} profile={profile} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
