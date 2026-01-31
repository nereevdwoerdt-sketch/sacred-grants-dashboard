// API Route for AI-Powered Grant Discovery
// POST /api/discovery/ai-run

import { NextResponse } from 'next/server'
import { runAIDiscovery, analyzePageForGrants, assessGrantRelevance } from '@/lib/ai-discovery'
import { grantSources } from '@/lib/discovery-config'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes max for Vercel

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      mode = 'quick', // quick | full | single-url
      url = null,
      region = 'int',
      maxSources = 10
    } = body

    // Single URL analysis mode
    if (mode === 'single-url' && url) {
      console.log(`🔍 Analyzing single URL: ${url}`)

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SacredGrantsBot/2.0)' },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `Failed to fetch URL: ${response.status}`
        }, { status: 400 })
      }

      const html = await response.text()

      // First do quick assessment
      const assessment = await assessGrantRelevance(html.substring(0, 5000), url)

      // Then deep analyze if relevant
      let grants = []
      if (assessment.shouldDeepAnalyze || assessment.fitScore >= 4) {
        grants = await analyzePageForGrants(url, html)
      }

      return NextResponse.json({
        success: true,
        mode: 'single-url',
        url,
        assessment,
        grantsFound: grants.length,
        grants
      })
    }

    // Quick or Full discovery mode
    const sourcesToUse = mode === 'full'
      ? grantSources.filter(s => s.enabled)
      : grantSources.filter(s => s.enabled).slice(0, maxSources)

    console.log(`🚀 Starting AI Discovery (${mode} mode) - ${sourcesToUse.length} sources`)

    const results = await runAIDiscovery({
      sources: sourcesToUse,
      maxSourcesPerRun: mode === 'full' ? 50 : maxSources,
      deepAnalyzeTop: mode === 'full' ? 20 : 5,
      searchQueries: mode === 'full' ? [
        'indigenous cacao grants 2026',
        'ceremonial food grants Australia',
        'cultural diplomacy grants Peru Australia',
        'sustainable agriculture grants Netherlands EU',
        'social enterprise food grants',
        'mental health wellbeing community grants',
        'fair trade cocoa chocolate funding',
        'rainforest indigenous community grants',
        'food innovation grants Australia',
        'NFP stichting grants Netherlands culture',
      ] : [
        'cacao grants 2026',
        'indigenous food grants',
        'Australia Peru cultural grants'
      ]
    })

    // Save discovered grants to Supabase (if configured)
    if (results.discoveredGrants.length > 0) {
      try {
        const supabase = await createClient()

        for (const grant of results.discoveredGrants) {
          await supabase
            .from('discovered_grants')
            .upsert({
              id: grant.id,
              name: grant.name,
              data: grant,
              source_url: grant.sourceUrl || grant.applyUrl,
              relevance_score: grant.sacredFitScore || 5,
              region: grant.region,
              status: 'pending',
              discovered_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
        console.log(`💾 Saved ${results.discoveredGrants.length} grants to database`)
      } catch (dbError) {
        console.error('Database save error:', dbError.message)
        // Continue even if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      stats: results.stats,
      newSourcesFound: results.newSources.length,
      grantsFound: results.discoveredGrants.length,
      grants: results.discoveredGrants,
      newSources: results.newSources.slice(0, 10),
      errors: results.errors.slice(0, 5)
    })

  } catch (error) {
    console.error('AI Discovery error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET endpoint for status/info
export async function GET() {
  return NextResponse.json({
    name: 'AI-Powered Grant Discovery',
    description: 'Uses Claude AI to intelligently find and analyze grants for Sacred Foundation',
    endpoints: {
      'POST /api/discovery/ai-run': {
        modes: {
          'quick': 'Fast scan of top 10 sources (2-3 minutes)',
          'full': 'Comprehensive scan of all sources + web search (10-15 minutes)',
          'single-url': 'Analyze a specific URL for grants'
        },
        params: {
          mode: 'quick | full | single-url',
          url: 'URL to analyze (for single-url mode)',
          region: 'Region code (au, nl, eu, int)',
          maxSources: 'Max sources to scan (default 10)'
        }
      }
    },
    features: [
      '🤖 AI-powered semantic analysis (not just keyword matching)',
      '🔍 Automatic discovery of new grant sources',
      '📝 Generates whySacredFits explanations',
      '✅ Assesses eligibility for Sacred entities',
      '📊 Scores grant relevance (1-10)',
      '💾 Saves to database for review'
    ]
  })
}
