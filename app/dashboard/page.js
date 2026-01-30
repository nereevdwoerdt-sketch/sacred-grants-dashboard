import DashboardContent from '@/components/DashboardContent'
import { grants, summary, categories } from '@/lib/grants-data'

// Only show approved grants on the main dashboard
const approvedGrants = grants.filter(g => g.approved === true)

export default async function DashboardPage() {
  return (
    <DashboardContent
      grants={approvedGrants}
      summary={summary}
      categories={categories}
      progress={[]}
      setupSteps={[]}
      unreadNotifications={0}
      userId="local-dev-user"
    />
  )
}
