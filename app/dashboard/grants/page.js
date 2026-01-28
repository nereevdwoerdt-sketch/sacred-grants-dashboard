import GrantsListPage from '@/components/GrantsListPage'
import { grants, categories } from '@/lib/grants-data'

export default async function GrantsPage() {
  return (
    <GrantsListPage
      grants={grants}
      categories={categories}
      progress={[]}
      userId="local-dev-user"
    />
  )
}
