import DashboardContent from '@/components/DashboardContent'
import { grants, summary, categories } from '@/lib/grants-data'

export default async function DashboardPage() {
  return (
    <DashboardContent
      grants={grants}
      summary={summary}
      categories={categories}
      progress={[]}
      setupSteps={[]}
      unreadNotifications={0}
      userId="local-dev-user"
    />
  )
}
