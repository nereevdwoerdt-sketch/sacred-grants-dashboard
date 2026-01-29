import { scrapeGrant } from '@/lib/scraper'
import { grants } from '@/lib/grants-data'

// Manual test endpoint for scraper
// Usage: GET /api/scraper/test?grant=dfat-acdgp

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const grantId = searchParams.get('grant')
  
  if (!grantId) {
    // Return list of available grants
    return Response.json({
      message: 'Provide ?grant=ID to test scraping',
      availableGrants: grants.slice(0, 10).map(g => ({
        id: g.id,
        name: g.name,
        url: g.applyUrl
      }))
    })
  }
  
  const grant = grants.find(g => g.id === grantId)
  if (!grant) {
    return Response.json({ error: 'Grant not found' }, { status: 404 })
  }
  
  const result = await scrapeGrant(grant)
  
  return Response.json({
    grant: {
      id: grant.id,
      name: grant.name,
      url: grant.applyUrl
    },
    scrapeResult: result
  })
}
