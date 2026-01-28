import NotificationsContent from '@/components/NotificationsContent'

export default async function NotificationsPage() {
  // Mock notifications for local dev
  const mockNotifications = [
    {
      id: '1',
      type: 'deadline',
      title: 'Deadline Alert: Ian Potter Cultural Trust',
      message: '7 days until the deadline!',
      grant_id: 'ian-potter-cultural',
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'deadline',
      title: 'Deadline Alert: DFAT ACDGP',
      message: '14 days until the deadline for DFAT ACDGP',
      grant_id: 'dfat-acdgp',
      read: false,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]

  return <NotificationsContent notifications={mockNotifications} userId="local-dev-user" />
}
