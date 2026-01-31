// AI-Powered Grant Discovery Engine
// Uses Claude API to intelligently find and analyze grants like a human researcher

import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic()

// Sacred's profile for AI context
const SACRED_PROFILE = `
Sacred Foundation Profile:
- Company: Sacred Taste Pty Ltd (Australia) - for-profit Pty Ltd
- Planned: Sacred Foundation EU (Stichting in Netherlands) - NFP in formation
- What we do: Import & process ceremonial-grade Criollo cacao from Ashaninka communities in Peru
- Products: Cacao powder blends (Earth, Fire, Love, Vitality, Ceremony), RTD cans coming soon
- Mission: Ceremonial cacao for wellbeing, mental health, alcohol alternatives
- Partnership: 300+ Ashaninka families, 22 communities along Rio Ene, Peru
- Impact: 1,200 acres rainforest saved, indigenous land rights, Equator Prize 2019
- Markets: Australia, NZ, Switzerland, Malaysia, Middle East
- Retail: Ritchies IGA (78 stores), David Jones, Monoprix Middle East

Key Grant Angles:
1. Food Innovation - Cacao processing, healthy alternatives to alcohol
2. Cultural Diplomacy - AU-Peru connection, Ashaninka partnership
3. Mental Health - Ceremonies for wellbeing, loneliness epidemic
4. Sustainability - Rainforest protection, ethical sourcing
5. Indigenous Rights - Land titles, cultural preservation
6. Documentary potential - Ashaninka story, Dan's Amazon journey

Eligibility:
- Sacred Taste Pty Ltd: Australian business grants, export grants, food innovation
- Sacred Foundation EU (when formed): Dutch/EU NFP grants, cultural funds
- Individual team members: Artist/individual grants possible

NOT eligible for:
- Grants requiring DGR/charity status (unless via fiscal sponsor)
- Grants requiring established NFP (until Stichting is formed)
`

/**
 * Analyze a webpage and extract grant opportunities using Claude
 */
export async function analyzePageForGrants(url, htmlContent) {
  const textContent = extractText(htmlContent).substring(0, 15000) // Limit for API

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a grant researcher for Sacred Foundation. Analyze this webpage and extract any grant/funding opportunities.

${SACRED_PROFILE}

PAGE URL: ${url}
PAGE CONTENT:
${textContent}

For each grant opportunity found, provide:
1. Grant name
2. Organization offering it
3. Amount (min/max if available)
4. Deadline (date or "rolling")
5. Brief description
6. Eligibility requirements
7. Sacred Fit Score (1-10) - how well it matches Sacred
8. Why Sacred Fits - specific explanation
9. Entity Type needed (Pty Ltd / NFP / Individual / Any)
10. Apply URL if found
11. Priority (urgent/high/medium/low)
12. Action Required - what Sacred should do next

Return as JSON array. If no grants found, return empty array [].
Format: [{ "name": "...", "organization": "...", "amount": {"min": 0, "max": 0, "display": "..."}, "deadline": "...", "deadlineDisplay": "...", "description": "...", "eligibility": ["..."], "sacredFitScore": 8, "whySacredFits": "...", "entityType": "pty-ltd", "applyUrl": "...", "priority": "high", "actionRequired": "..." }]`
      }]
    })

    const text = response.content[0].text
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (error) {
    console.error('AI analysis error:', error.message)
    return []
  }
}

/**
 * Search the web for new grant sources using Claude
 */
export async function discoverNewGrantSources(searchQuery) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a grant researcher for Sacred Foundation.

${SACRED_PROFILE}

Based on this search query: "${searchQuery}"

List 10 potential grant sources/organizations that might fund projects like Sacred's. For each, provide:
1. Organization name
2. Website URL
3. Type (government/foundation/corporate/accelerator)
4. Region focus
5. Categories they fund
6. Why relevant to Sacred

Return as JSON array:
[{ "name": "...", "url": "...", "type": "...", "region": "...", "categories": ["..."], "relevance": "..." }]`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return []
  } catch (error) {
    console.error('AI source discovery error:', error.message)
    return []
  }
}

/**
 * Generate a complete grant entry from discovered opportunity
 */
export async function generateGrantEntry(grantInfo, region) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Generate a complete grant database entry for Sacred Foundation's dashboard.

${SACRED_PROFILE}

Grant Information:
${JSON.stringify(grantInfo, null, 2)}

Region: ${region}

Generate a complete entry in this exact format:
{
  "id": "kebab-case-unique-id",
  "name": "Grant Name",
  "region": "${region}",
  "category": "pty-ltd|nfp|individual",
  "grantCategory": "food|cultural|social-enterprise|environment|indigenous|documentary|health",
  "amount": { "min": 0, "max": 0, "display": "€X-€Y" },
  "deadline": "YYYY-MM-DD or rolling",
  "deadlineDisplay": "DD Mon YYYY or Rolling",
  "urgency": "urgent|high|medium|low",
  "entityType": "Pty Ltd|NFP/Stichting|Individual|Any",
  "description": "2-3 sentence description",
  "whySacredFits": "Specific explanation why Sacred is a good fit",
  "eligibility": ["requirement 1", "requirement 2"],
  "actionRequired": "Specific next step for Sacred team",
  "applyUrl": "https://...",
  "sourceUrl": "https://...",
  "tags": ["relevant", "tags"],
  "addedDate": "${new Date().toISOString().split('T')[0]}",
  "isNew": true,
  "approved": false
}

Return ONLY the JSON object, no other text.`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('AI grant generation error:', error.message)
    return null
  }
}

/**
 * Assess if a grant is worth pursuing
 */
export async function assessGrantRelevance(grantText, grantUrl) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Quickly assess if this grant is relevant for Sacred Foundation.

${SACRED_PROFILE}

GRANT URL: ${grantUrl}
GRANT TEXT: ${grantText.substring(0, 5000)}

Respond with JSON:
{
  "isRelevant": true/false,
  "fitScore": 1-10,
  "eligibleEntity": "pty-ltd|nfp|individual|none",
  "quickReason": "One sentence why/why not",
  "shouldDeepAnalyze": true/false
}`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { isRelevant: false, fitScore: 0, shouldDeepAnalyze: false }
  } catch (error) {
    console.error('AI relevance error:', error.message)
    return { isRelevant: false, fitScore: 0, shouldDeepAnalyze: false }
  }
}

/**
 * Run comprehensive AI-powered grant discovery
 */
export async function runAIDiscovery(options = {}) {
  const {
    sources = [],
    searchQueries = [
      'indigenous cacao grants 2026',
      'ceremonial food grants Australia',
      'cultural diplomacy grants Peru',
      'sustainable agriculture grants Netherlands',
      'social enterprise food grants',
      'mental health wellbeing grants Australia',
      'fair trade cocoa funding',
    ],
    maxSourcesPerRun = 20,
    deepAnalyzeTop = 10
  } = options

  const results = {
    discoveredGrants: [],
    newSources: [],
    errors: [],
    stats: {
      sourcesScraped: 0,
      pagesAnalyzed: 0,
      grantsFound: 0,
      relevantGrants: 0
    }
  }

  // Step 1: Discover new sources via AI
  console.log('🔍 Discovering new grant sources...')
  for (const query of searchQueries.slice(0, 3)) {
    try {
      const newSources = await discoverNewGrantSources(query)
      results.newSources.push(...newSources)
    } catch (e) {
      results.errors.push({ stage: 'source-discovery', query, error: e.message })
    }
  }

  // Step 2: Scrape and analyze sources
  const allSources = [...sources, ...results.newSources.slice(0, 5)]
  console.log(`📡 Analyzing ${allSources.length} sources...`)

  for (const source of allSources.slice(0, maxSourcesPerRun)) {
    try {
      const url = source.url || source
      console.log(`  → Fetching ${url}`)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SacredGrantsBot/2.0)',
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) continue

      const html = await response.text()
      results.stats.sourcesScraped++

      // Quick relevance check first
      const textContent = extractText(html)
      const quickCheck = await assessGrantRelevance(textContent.substring(0, 3000), url)

      if (quickCheck.shouldDeepAnalyze || quickCheck.fitScore >= 5) {
        results.stats.pagesAnalyzed++

        // Deep analysis with AI
        const grants = await analyzePageForGrants(url, html)
        results.stats.grantsFound += grants.length

        for (const grant of grants) {
          if (grant.sacredFitScore >= 5) {
            results.stats.relevantGrants++

            // Generate complete entry
            const fullEntry = await generateGrantEntry(grant, source.region || 'int')
            if (fullEntry) {
              results.discoveredGrants.push(fullEntry)
            }
          }
        }
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000))

    } catch (error) {
      results.errors.push({
        source: source.url || source,
        error: error.message
      })
    }
  }

  console.log(`✅ Discovery complete: ${results.stats.relevantGrants} relevant grants found`)
  return results
}

/**
 * Helper: Extract text from HTML
 */
function extractText(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export default {
  analyzePageForGrants,
  discoverNewGrantSources,
  generateGrantEntry,
  assessGrantRelevance,
  runAIDiscovery
}
