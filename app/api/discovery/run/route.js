import { createClient } from '@supabase/supabase-js'
import { discoverGrants, deepScrapeGrant } from '@/lib/grant-discovery'
import { minimumRelevanceScore } from '@/lib/discovery-config'

// This endpoint runs discovery from the UI (no auth required for logged-in users)
// For manual triggering from the dashboard

export const maxDuration = 300 // Allow up to 5 minutes

const MAX_SOURCES = 8
const MAX_DEEP_SCRAPE = 15

export async function POST(request) {
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
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        runLog.errors.push({
          grant: grant.id,
          error: error.message
        })
      }
    }

    runLog.relevant_grants = detailedGrants.length

    // Step 4: Save relevant grants to database (including raw text for later AI analysis)
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
        raw_text: grant.rawText, // Raw scraped text for Claude Code analysis
        status: 'new',
        discovered_at: grant.discoveredAt,
        last_scraped: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    }

    // Step 5: Log the run
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
