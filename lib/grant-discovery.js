// Grant Discovery Engine for Sacred Foundation
// Scrapes grant databases and scores relevance

import crypto from 'crypto'
import {
  sacredKeywords,
  relevanceWeights,
  minimumRelevanceScore,
  grantSources,
  relevantCategories
} from './discovery-config'

/**
 * Calculate relevance score for a grant based on Sacred's keywords
 */
export function calculateRelevanceScore(grantText, grantData = {}) {
  let score = 0
  const matches = {
    primary: [],
    secondary: [],
    geographic: [],
    excluded: []
  }

  const textLower = grantText.toLowerCase()

  // Check primary keywords (highest weight)
  for (const keyword of sacredKeywords.primary) {
    if (textLower.includes(keyword.toLowerCase())) {
      score += relevanceWeights.primaryKeyword
      matches.primary.push(keyword)
    }
  }

  // Check secondary keywords
  for (const keyword of sacredKeywords.secondary) {
    if (textLower.includes(keyword.toLowerCase())) {
      score += relevanceWeights.secondaryKeyword
      matches.secondary.push(keyword)
    }
  }

  // Check geographic keywords
  for (const keyword of sacredKeywords.geographic) {
    if (textLower.includes(keyword.toLowerCase())) {
      score += relevanceWeights.geographicMatch
      matches.geographic.push(keyword)
    }
  }

  // Check exclude keywords (negative score)
  for (const keyword of sacredKeywords.exclude) {
    if (textLower.includes(keyword.toLowerCase())) {
      score += relevanceWeights.excludeKeyword
      matches.excluded.push(keyword)
    }
  }

  // Amount bonus
  if (grantData.amount) {
    const amount = parseGrantAmount(grantData.amount)
    if (amount > 0) {
      if (amount > 200000) score += relevanceWeights.amountBonus.major
      else if (amount > 50000) score += relevanceWeights.amountBonus.large
      else if (amount > 10000) score += relevanceWeights.amountBonus.medium
      else score += relevanceWeights.amountBonus.small
    }
  }

  // Deadline bonus
  if (grantData.deadline) {
    const daysUntil = getDaysUntilDeadline(grantData.deadline)
    if (daysUntil > 0 && daysUntil < 30) {
      score += relevanceWeights.deadlineBonus.urgent
    } else if (daysUntil >= 30 && daysUntil < 90) {
      score += relevanceWeights.deadlineBonus.soon
    }
  }

  return {
    score: Math.max(0, score),
    matches,
    isRelevant: score >= minimumRelevanceScore
  }
}

/**
 * Parse grant amount from various formats
 */
function parseGrantAmount(amountStr) {
  if (!amountStr) return 0

  const str = amountStr.toString().toLowerCase()

  // Remove currency symbols and extract numbers
  const numbers = str.match(/[\d,]+(?:\.\d+)?/g)
  if (!numbers) return 0

  // Get the largest number (usually the max amount)
  const amounts = numbers.map(n => parseFloat(n.replace(/,/g, '')))
  return Math.max(...amounts)
}

/**
 * Calculate days until deadline
 */
function getDaysUntilDeadline(deadlineStr) {
  if (!deadlineStr || deadlineStr === 'rolling' || deadlineStr === 'ongoing') {
    return 365 // Assume far future for rolling deadlines
  }

  try {
    const deadline = new Date(deadlineStr)
    const today = new Date()
    const diffTime = deadline - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return 365
  }
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html) {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Generate unique ID for a discovered grant
 */
function generateGrantId(sourceId, title, url) {
  const hash = crypto.createHash('md5')
    .update(`${sourceId}-${title}-${url}`)
    .digest('hex')
    .substring(0, 8)
  return `discovered-${sourceId}-${hash}`
}

/**
 * Extract grant listings from a page
 */
function extractGrantListings(html, sourceConfig) {
  const grants = []
  const seenUrls = new Set()

  // Keywords that indicate an ACTUAL grant application (high priority)
  const applicationKeywords = [
    'apply now', 'apply here', 'submit application', 'application form',
    'call for', 'open call', 'funding call', 'grant application',
    'aanvragen', 'aanvraag indienen', 'solliciteren', 'inschrijven',
    'deadline', 'submit by', 'applications open', 'now accepting',
    'rfp', 'request for proposals', 'letter of inquiry', 'loi'
  ]

  // Keywords that indicate a grant/funding page (medium priority)
  const grantKeywords = [
    'grant', 'funding', 'fund', 'fellowship', 'award', 'program', 'programme',
    'opportunity', 'call', 'application', 'apply', 'subsidie', 'aanvraag',
    'beurs', 'steun', 'financiering', 'support', 'initiative', 'prize',
    'competition', 'challenge', 'scholarship'
  ]

  // Keywords that indicate general/info pages (skip these)
  const skipKeywords = [
    'about us', 'our team', 'contact us', 'privacy policy', 'terms',
    'news', 'blog', 'press', 'media', 'career', 'jobs', 'staff',
    'annual report', 'history', 'mission', 'vision', 'who we are',
    'over ons', 'nieuws', 'vacatures', 'disclaimer'
  ]

  // Extract links that might be grant pages
  let match
  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    // Clean HTML from title
    let title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    // Skip invalid links
    if (!title || title.length < 5 || title.length > 300) continue
    if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) continue
    if (url.includes('login') || url.includes('signup') || url.includes('contact')) continue

    const urlLower = url.toLowerCase()
    const titleLower = title.toLowerCase()
    const combined = urlLower + ' ' + titleLower

    // Skip general/info pages
    if (skipKeywords.some(kw => combined.includes(kw))) continue

    // Calculate link quality score
    let linkScore = 0

    // High score for application-specific keywords
    if (applicationKeywords.some(kw => combined.includes(kw))) {
      linkScore += 50
    }

    // Medium score for grant keywords
    if (grantKeywords.some(kw => combined.includes(kw))) {
      linkScore += 20
    }

    // Bonus for Sacred's keywords
    if (sacredKeywords.primary.some(kw => combined.includes(kw.toLowerCase()))) {
      linkScore += 30
    }
    if (sacredKeywords.secondary.slice(0, 10).some(kw => combined.includes(kw.toLowerCase()))) {
      linkScore += 15
    }

    // Bonus for URLs that look like specific grant pages
    if (urlLower.match(/\/(call|grant|funding|program|fellowship|opportunity|subsidie)s?\/[^\/]+/)) {
      linkScore += 25
    }

    // Penalty for very short or generic titles
    if (title.length < 15) linkScore -= 10
    if (['home', 'back', 'more', 'read more', 'learn more', 'click here'].includes(titleLower)) {
      linkScore -= 30
    }

    // Only include links with positive score
    if (linkScore <= 0) continue

    // Make URL absolute
    let absoluteUrl = url
    try {
      if (url.startsWith('/')) {
        const baseUrl = new URL(sourceConfig.url)
        absoluteUrl = `${baseUrl.origin}${url}`
      } else if (!url.startsWith('http')) {
        const baseUrl = new URL(sourceConfig.url)
        absoluteUrl = `${baseUrl.origin}/${url}`
      }
    } catch {
      continue // Skip invalid URLs
    }

    // Skip duplicates
    if (seenUrls.has(absoluteUrl)) continue
    seenUrls.add(absoluteUrl)

    grants.push({
      title: title,
      url: absoluteUrl,
      source: sourceConfig.id,
      sourceName: sourceConfig.name,
      linkScore: linkScore
    })
  }

  // Sort by link score (best links first)
  grants.sort((a, b) => b.linkScore - a.linkScore)

  return grants
}

/**
 * Scrape a single grant source for new opportunities
 */
export async function scrapeGrantSource(sourceConfig) {
  if (!sourceConfig.enabled) {
    return { success: false, reason: 'Source disabled' }
  }

  try {
    const response = await fetch(sourceConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SacredGrantsBot/1.0; +https://sacred-grants-dashboard.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      return {
        success: false,
        sourceId: sourceConfig.id,
        error: `HTTP ${response.status}`
      }
    }

    const html = await response.text()
    const pageText = extractTextFromHtml(html)

    // Extract grant listings from the page
    const listings = extractGrantListings(html, sourceConfig)

    // Score the page itself for relevance
    const pageRelevance = calculateRelevanceScore(pageText)

    return {
      success: true,
      sourceId: sourceConfig.id,
      sourceName: sourceConfig.name,
      region: sourceConfig.region,
      listings: listings,
      pageRelevance: pageRelevance.score,
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      sourceId: sourceConfig.id,
      error: error.message
    }
  }
}

/**
 * Scrape individual grant page for details
 */
export async function scrapeGrantDetails(grantUrl, sourceConfig) {
  try {
    const response = await fetch(grantUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SacredGrantsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const text = extractTextFromHtml(html)

    // Extract structured data
    const extractedData = {
      deadline: extractDeadlineFromText(text),
      amount: extractAmountFromText(text),
      description: extractDescription(text),
      eligibility: extractEligibility(text)
    }

    // Calculate relevance score
    const relevance = calculateRelevanceScore(text, extractedData)

    return {
      success: true,
      url: grantUrl,
      text: text.substring(0, 5000), // Limit stored text
      extractedData,
      relevanceScore: relevance.score,
      keywordMatches: relevance.matches,
      isRelevant: relevance.isRelevant,
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Extract deadline from text
 */
function extractDeadlineFromText(text) {
  const patterns = [
    /deadline[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /closes?[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /due[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /rolling|ongoing|open|no deadline/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (/rolling|ongoing|open|no deadline/i.test(match[0])) {
        return 'rolling'
      }
      return match[1]
    }
  }
  return null
}

/**
 * Extract amount from text
 */
function extractAmountFromText(text) {
  const patterns = [
    /(?:up to |maximum |max\.? )?(€|EUR|\$|AUD |A\$)?[\s]?([\d,]+(?:\.\d{2})?)\s*(?:million|k|thousand)?/gi,
    /grants? (?:of |up to |ranging from )?(€|EUR|\$|AUD )?([\d,]+)/gi
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match) {
      const currency = match[1] || '€'
      const amount = match[2]
      return `${currency}${amount}`
    }
  }
  return null
}

/**
 * Extract description (first meaningful paragraph)
 */
function extractDescription(text) {
  // Split into sentences and get first 2-3 meaningful ones
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 50 && s.length < 500)

  return sentences.slice(0, 3).join('. ') + '.'
}

/**
 * Extract eligibility criteria
 */
function extractEligibility(text) {
  const eligibilitySection = text.match(/eligib(?:le|ility)[^.]*[.:]([^]*?)(?=\n\n|deadline|how to apply|$)/i)
  if (eligibilitySection) {
    return eligibilitySection[1].trim().substring(0, 500)
  }
  return null
}

/**
 * Discover grants from all enabled sources
 */
export async function discoverGrants(options = {}) {
  const {
    maxSources = 10,
    maxGrantsPerSource = 20
  } = options

  const enabledSources = grantSources
    .filter(s => s.enabled)
    .slice(0, maxSources)

  const results = {
    success: true,
    sourcesScraped: 0,
    grantsFound: 0,
    relevantGrants: [],
    errors: [],
    timestamp: new Date().toISOString()
  }

  // Scrape sources in batches to avoid overwhelming
  const BATCH_SIZE = 3

  for (let i = 0; i < enabledSources.length; i += BATCH_SIZE) {
    const batch = enabledSources.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(source => scrapeGrantSource(source))
    )

    for (const result of batchResults) {
      if (result.success) {
        results.sourcesScraped++
        results.grantsFound += result.listings?.length || 0

        // Score and filter relevant grants
        for (const listing of (result.listings || [])) {
          const grantId = generateGrantId(result.sourceId, listing.title, listing.url)

          // Quick relevance check on title
          const titleRelevance = calculateRelevanceScore(listing.title)

          if (titleRelevance.score > 0) {
            results.relevantGrants.push({
              id: grantId,
              title: listing.title,
              url: listing.url,
              source: result.sourceId,
              sourceName: result.sourceName,
              region: result.region,
              titleRelevanceScore: titleRelevance.score,
              keywordMatches: titleRelevance.matches,
              discoveredAt: new Date().toISOString()
            })
          }
        }
      } else {
        results.errors.push({
          source: result.sourceId,
          error: result.error
        })
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < enabledSources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Sort by relevance score
  results.relevantGrants.sort((a, b) => b.titleRelevanceScore - a.titleRelevanceScore)

  // Limit results
  results.relevantGrants = results.relevantGrants.slice(0, maxGrantsPerSource * enabledSources.length)

  return results
}

/**
 * Deep scrape a specific discovered grant for full details
 */
export async function deepScrapeGrant(discoveredGrant) {
  const source = grantSources.find(s => s.id === discoveredGrant.source)

  const details = await scrapeGrantDetails(discoveredGrant.url, source)

  if (!details.success) {
    return {
      ...discoveredGrant,
      detailsScraped: false,
      error: details.error
    }
  }

  return {
    ...discoveredGrant,
    detailsScraped: true,
    fullRelevanceScore: details.relevanceScore,
    isRelevant: details.isRelevant,
    keywordMatches: details.keywordMatches,
    extractedData: details.extractedData,
    description: details.extractedData.description,
    deadline: details.extractedData.deadline,
    amount: details.extractedData.amount,
    eligibility: details.extractedData.eligibility,
    rawText: details.text, // Save raw text for later AI analysis
    lastScraped: new Date().toISOString()
  }
}
