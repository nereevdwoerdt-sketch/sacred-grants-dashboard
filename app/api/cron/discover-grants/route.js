import { createClient } from '@supabase/supabase-js'
import { discoverGrants, deepScrapeGrant } from '@/lib/grant-discovery'
import { minimumRelevanceScore } from '@/lib/discovery-config'

// This endpoint discovers new grants from various sources
// Runs weekly via Vercel Cron

export const maxDuration = 300 // Allow up to 5 minutes for discovery

const MAX_SOURCES = 50       // Scrape ALL enabled sources
const MAX_DEEP_SCRAPE = 50   // Deep scrape more grants for details

export async function GET(request) {
  // Verify the request is from Vercel Cron or has valid auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = (process.env.CRON_SECRET || '').trim()
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const runLog = {
    sources_scraped: 0,
    grants_found: 0,
    relevant_grants: 0,
    errors: [],
    started_at: new Date().toISOString()
  }

  try {
    // Step 1: Discover grants from sources
    const discoveryResults = await discoverGrants({
      maxSources: MAX_SOURCES,
      maxGrantsPerSource: 30
    })

    runLog.sources_scraped = discoveryResults.sourcesScraped
    runLog.grants_found = discoveryResults.grantsFound
    runLog.errors = discoveryResults.errors

    // Step 2: Filter out already-known grants
    const { data: existingGrants } = await supabase
      .from('discovered_grants')
      .select('url')

    const existingUrls = new Set((existingGrants || []).map(g => g.url))

    const newGrants = discoveryResults.relevantGrants.filter(
      g => !existingUrls.has(g.url)
    )

    // Step 3: Deep scrape top candidates for full details
    const grantsToDeepScrape = newGrants
      .filter(g => g.titleRelevanceScore >= minimumRelevanceScore / 2)
      .slice(0, MAX_DEEP_SCRAPE)

    const detailedGrants = []

    for (const grant of grantsToDeepScrape) {
      try {
        const detailed = await deepScrapeGrant(grant)
        if (detailed.isRelevant) {
          detailedGrants.push(detailed)
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        runLog.errors.push({
          grant: grant.id,
          error: error.message
        })
      }
    }

    runLog.relevant_grants = detailedGrants.length

    // Step 4: Save relevant grants to database
    for (const grant of detailedGrants) {
      await supabase.from('discovered_grants').upsert({
        id: grant.id,
        title: grant.title,
        url: grant.url,
        source_id: grant.source,
        source_name: grant.sourceName,
        region: grant.region,
        relevance_score: grant.fullRelevanceScore || grant.titleRelevanceScore,
        keyword_matches: grant.keywordMatches,
        description: grant.description,
        deadline: grant.deadline,
        amount: grant.amount,
        eligibility: grant.eligibility,
        status: 'new',
        discovered_at: grant.discoveredAt,
        last_scraped: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    }

    // Step 5: Notify users about new relevant grants
    if (detailedGrants.length > 0) {
      // Get all users to notify about new grants
      const { data: users } = await supabase
        .from('profiles')
        .select('id')

      if (users?.length > 0) {
        const notifications = users.map(user => ({
          user_id: user.id,
          type: 'new_grant',
          title: `${detailedGrants.length} New Grant${detailedGrants.length > 1 ? 's' : ''} Discovered`,
          message: `Found ${detailedGrants.length} potentially relevant grant${detailedGrants.length > 1 ? 's' : ''}: ${detailedGrants.slice(0, 3).map(g => g.title).join(', ')}${detailedGrants.length > 3 ? '...' : ''}`,
          grant_id: null
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    // Step 6: Log the run
    runLog.completed_at = new Date().toISOString()
    await supabase.from('discovery_runs').insert(runLog)

    return Response.json({
      success: true,
      sourcesScraped: runLog.sources_scraped,
      grantsFound: runLog.grants_found,
      newRelevantGrants: runLog.relevant_grants,
      errors: runLog.errors.length,
      topDiscoveries: detailedGrants.slice(0, 5).map(g => ({
        title: g.title,
        score: g.fullRelevanceScore || g.titleRelevanceScore,
        source: g.sourceName
      })),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    runLog.errors.push({ fatal: error.message })
    runLog.completed_at = new Date().toISOString()

    // Still try to log the failed run
    try {
      await supabase.from('discovery_runs').insert(runLog)
    } catch {}

    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
