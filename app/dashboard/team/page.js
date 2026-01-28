import TeamContent from '@/components/TeamContent'

export default async function TeamPage() {
  // Mock team for local dev
  const mockTeams = [
    {
      id: '1',
      name: 'Sacred Foundation Team',
      slug: 'sacred-foundation',
      role: 'owner',
      members: [
        {
          user_id: 'local-dev-user',
          role: 'owner',
          profile: { full_name: 'You', email: 'dev@sacredfoundation.org' }
        }
      ]
    }
  ]

  return <TeamContent teams={mockTeams} userId="local-dev-user" userEmail="dev@sacredfoundation.org" />
}
