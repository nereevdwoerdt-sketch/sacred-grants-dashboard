import { discoverGrants, calculateRelevanceScore } from '@/lib/grant-discovery'
import { grantSources, sacredKeywords } from '@/lib/discovery-config'

// Manual test endpoint for grant discovery
// Usage: GET /api/discovery/test
// Or: GET /api/discovery/test?source=doen-foundation

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('source')
  const testText = searchParams.get('text')

  // If testing relevance scoring
  if (testText) {
    const result = calculateRelevanceScore(testText)
    return Response.json({
      text: testText.substring(0, 200) + '...',
      ...result
    })
  }

  // If testing a specific source
  if (sourceId) {
    const source = grantSources.find(s => s.id === sourceId)
    if (!source) {
      return Response.json({
        error: 'Source not found',
        availableSources: grantSources.map(s => ({
          id: s.id,
          name: s.name,
          enabled: s.enabled
        }))
      }, { status: 404 })
    }

    // Import and run the source scraper
    const { scrapeGrantSource } = await import('@/lib/grant-discovery')
    const result = await scrapeGrantSource(source)

    return Response.json({
      source: {
        id: source.id,
        name: source.name,
        url: source.url
      },
      result
    })
  }

  // Show available options
  return Response.json({
    message: 'Grant Discovery Test Endpoint',
    usage: {
      testSource: 'GET /api/discovery/test?source=doen-foundation',
      testRelevance: 'GET /api/discovery/test?text=indigenous cacao ceremony',
      runDiscovery: 'GET /api/cron/discover-grants (requires auth)'
    },
    keywords: sacredKeywords,
    sources: grantSources.filter(s => s.enabled).map(s => ({
      id: s.id,
      name: s.name,
      region: s.region,
      type: s.type,
      url: s.url
    }))
  })
}
