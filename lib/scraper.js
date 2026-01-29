// Grant Website Scraper
// Checks grant websites for changes and extracts key information

import crypto from 'crypto'
import { grants } from './grants-data'

// Create a hash of content to detect changes
function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

// Clean HTML and extract text
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Try to extract deadline from page content
function extractDeadline(text) {
  const patterns = [
    /(?:deadline|closes?|due|submit by)[:\s]*(\d{1,2}[\s/-]\w+[\s/-]\d{2,4})/i,
    /(?:deadline|closes?|due|submit by)[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}[\s/-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s/-]\d{2,4})/i,
    /(?:applications?\s+close)[:\s]*(\d{1,2}[\s/-]\w+[\s/-]\d{2,4})/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Try to extract amount from page content
function extractAmount(text) {
  const patterns = [
    /(?:up to|maximum|grant of|funding of)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /\$([\d,]+(?:\.\d{2})?)\s*(?:to|[-–])\s*\$([\d,]+(?:\.\d{2})?)/i,
    /€([\d,]+(?:\.\d{2})?)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  return null
}

// Check if a grant appears to be closed
function checkIfClosed(text) {
  const closedPatterns = [
    /applications?\s+(?:are\s+)?closed/i,
    /no\s+longer\s+accepting/i,
    /funding\s+round\s+(?:has\s+)?closed/i,
    /program\s+(?:has\s+)?ended/i,
  ]
  
  return closedPatterns.some(pattern => pattern.test(text))
}

// Fetch a URL with timeout and error handling
async function fetchWithTimeout(url, timeout = 15000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SacredGrantsBot/1.0; +https://sacred-grants-dashboard.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Scrape a single grant page
export async function scrapeGrant(grant) {
  const result = {
    grantId: grant.id,
    url: grant.applyUrl,
    success: false,
    error: null,
    hash: null,
    extractedData: {},
    hasChanged: false,
  }
  
  try {
    const html = await fetchWithTimeout(grant.applyUrl)
    const text = extractText(html)
    result.hash = hashContent(text)
    
    // Extract information
    const deadline = extractDeadline(text)
    const amount = extractAmount(text)
    const isClosed = checkIfClosed(text)
    
    result.extractedData = {
      deadline,
      amount,
      isClosed,
      textLength: text.length,
      scrapedAt: new Date().toISOString(),
    }
    
    result.success = true
  } catch (error) {
    result.error = error.message
  }
  
  return result
}

// Scrape all grants (or a subset)
export async function scrapeAllGrants(grantIds = null, batchSize = 5) {
  const grantsToScrape = grantIds 
    ? grants.filter(g => grantIds.includes(g.id))
    : grants.filter(g => g.applyUrl && !g.applyUrl.includes('rolling'))
  
  const results = []
  
  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < grantsToScrape.length; i += batchSize) {
    const batch = grantsToScrape.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(grant => scrapeGrant(grant))
    )
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + batchSize < grantsToScrape.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// Compare scrape results with cached data
export function detectChanges(scrapeResult, cachedData) {
  if (!cachedData) {
    return { isNew: true, changes: [] }
  }
  
  const changes = []
  
  // Check if page content changed (hash comparison)
  if (scrapeResult.hash !== cachedData.page_hash) {
    changes.push({
      field: 'page_content',
      oldValue: 'previous version',
      newValue: 'updated content',
    })
  }
  
  // Check specific fields if available
  const cached = cachedData.extracted_data || {}
  const current = scrapeResult.extractedData || {}
  
  if (current.deadline && cached.deadline !== current.deadline) {
    changes.push({
      field: 'deadline',
      oldValue: cached.deadline,
      newValue: current.deadline,
    })
  }
  
  if (current.isClosed && !cached.isClosed) {
    changes.push({
      field: 'status',
      oldValue: 'open',
      newValue: 'closed',
    })
  }
  
  return { isNew: false, changes }
}

export default {
  scrapeGrant,
  scrapeAllGrants,
  detectChanges,
  hashContent,
}
