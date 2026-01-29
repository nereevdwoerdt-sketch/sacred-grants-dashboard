import { createClient } from '@supabase/supabase-js'

// Get discovered grants that have been added to the main list
export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'added'

  let query = supabase
    .from('discovered_grants')
    .select('*')
    .order('relevance_score', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Transform to match the grants format
  const transformedGrants = (data || []).map(grant => ({
    id: grant.id,
    name: grant.title,
    region: grant.region?.toLowerCase() === 'netherlands' ? 'nl' :
            grant.region?.toLowerCase() === 'australia' ? 'au' :
            grant.region?.toLowerCase() === 'europe' ? 'eu' :
            grant.region?.toLowerCase() === 'peru' ? 'peru' :
            grant.region?.toLowerCase() === 'latin america' ? 'latam' : 'global',
    category: 'discovered',
    grantCategory: 'discovered',
    amount: parseAmount(grant.amount),
    deadline: grant.deadline || 'rolling',
    deadlineDisplay: grant.deadline || 'Rolling',
    urgency: 'medium',
    entityType: 'Various',
    description: grant.description || `Grant opportunity from ${grant.source_name}`,
    whySacredFits: `Matched keywords: ${formatKeywords(grant.keyword_matches)}`,
    eligibility: grant.eligibility ? [grant.eligibility] : ['Check source website for eligibility details'],
    actionRequired: 'Review grant details on source website',
    applyUrl: grant.url,
    sourceUrl: grant.url,
    tags: ['discovered', 'new', ...(grant.keyword_matches?.primary || [])],
    addedDate: grant.discovered_at,
    isNew: true,
    isDiscovered: true,
    relevanceScore: grant.relevance_score,
    sourceName: grant.source_name
  }))

  return Response.json(transformedGrants)
}

function parseAmount(amountStr) {
  if (!amountStr) {
    return { min: 0, max: 0, display: 'Varies' }
  }

  // Try to extract numbers
  const numbers = amountStr.match(/[\d,]+/g)
  if (!numbers) {
    return { min: 0, max: 0, display: amountStr }
  }

  const amounts = numbers.map(n => parseInt(n.replace(/,/g, '')))
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)

  return {
    min,
    max,
    display: amountStr
  }
}

function formatKeywords(matches) {
  if (!matches) return 'general match'
  const all = [
    ...(matches.primary || []),
    ...(matches.secondary || []).slice(0, 2),
    ...(matches.geographic || [])
  ]
  return all.join(', ') || 'general match'
}
