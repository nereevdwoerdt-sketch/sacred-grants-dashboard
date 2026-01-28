import ProgressContent from '@/components/ProgressContent'
import { grants } from '@/lib/grants-data'

export default async function ProgressPage() {
  return <ProgressContent grants={grants} progress={[]} userId="local-dev-user" />
}
