'use client'

import { useState, useEffect } from 'react'
import GrantsListPage from '@/components/GrantsListPage'
import { grants as staticGrants, categories as staticCategories } from '@/lib/grants-data'

// Filter to only show approved grants
const approvedGrants = staticGrants.filter(g => g.approved === true)

export default function GrantsPage() {
  const [allGrants, setAllGrants] = useState(approvedGrants)
  const [categories, setCategories] = useState(staticCategories)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDiscoveredGrants() {
      try {
        const response = await fetch('/api/grants/discovered?status=added')
        const discoveredGrants = await response.json()

        if (Array.isArray(discoveredGrants) && discoveredGrants.length > 0) {
          // Combine approved static grants and discovered grants
          setAllGrants([...discoveredGrants, ...approvedGrants])

          // Add "Discovered" category
          const discoveredCategory = {
            id: 'discovered',
            name: 'Newly Discovered',
            count: discoveredGrants.length
          }

          // Update counts and add new category at the beginning
          setCategories([
            staticCategories[0], // 'all'
            discoveredCategory,
            ...staticCategories.slice(1)
          ])
        }
      } catch (error) {
        console.error('Failed to load discovered grants:', error)
      }
      setLoading(false)
    }

    loadDiscoveredGrants()
  }, [])

  return (
    <GrantsListPage
      grants={allGrants}
      categories={categories}
      progress={[]}
      userId="local-dev-user"
      loading={loading}
    />
  )
}
