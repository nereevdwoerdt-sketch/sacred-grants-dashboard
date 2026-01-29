import { createClient } from '@supabase/supabase-js'
import { scrapeGrant, detectChanges } from '@/lib/scraper'
import { grants } from '@/lib/grants-data'

// This endpoint scrapes grant websites and detects changes
// Runs weekly via Vercel Cron - checks 10 grants per run

export const maxDuration = 60 // Allow up to 60 seconds for scraping

const GRANTS_PER_RUN = 10 // Limit to avoid timeout

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

  const results = {
    success: true,
    grantsChecked: 0,
    changesDetected: 0,
    errors: 0,
    updates: [],
    timestamp: new Date().toISOString()
  }

  try {
    // Get grants that haven't been checked recently (oldest first)
    const { data: recentlyChecked } = await supabase
      .from('grant_cache')
      .select('grant_id')
      .order('last_checked', { ascending: true })
      .limit(100)

    const checkedIds = new Set((recentlyChecked || []).map(g => g.grant_id))

    // Prioritize unchecked grants, then oldest checked
    const grantsToCheck = grants
      .filter(g => g.applyUrl && !g.deadline?.includes('rolling'))
      .sort((a, b) => {
        const aChecked = checkedIds.has(a.id)
        const bChecked = checkedIds.has(b.id)
        if (aChecked !== bChecked) return aChecked ? 1 : -1
        return 0
      })
      .slice(0, GRANTS_PER_RUN)

    // Scrape selected grants
    const scrapeResults = await Promise.all(
      grantsToCheck.map(grant => scrapeGrant(grant))
    )
    results.grantsChecked = scrapeResults.length

    for (const result of scrapeResults) {
      if (!result.success) {
        results.errors++
        continue
      }

      // Get cached data from database
      const { data: cached } = await supabase
        .from('grant_cache')
        .select('*')
        .eq('grant_id', result.grantId)
        .single()

      // Detect changes
      const { isNew, changes } = detectChanges(result, cached)

      // Update cache
      await supabase.from('grant_cache').upsert({
        grant_id: result.grantId,
        source_url: result.url,
        page_hash: result.hash,
        last_checked: new Date().toISOString(),
        last_changed: changes.length > 0 ? new Date().toISOString() : cached?.last_changed,
        extracted_data: result.extractedData,
        status: result.extractedData.isClosed ? 'closed' : 'active'
      })

      // If changes detected, log them and notify users
      if (changes.length > 0) {
        results.changesDetected++
        results.updates.push({
          grantId: result.grantId,
          changes: changes.map(c => c.field)
        })

        // Log each change
        for (const change of changes) {
          await supabase.from('grant_updates').insert({
            grant_id: result.grantId,
            field_changed: change.field,
            old_value: change.oldValue,
            new_value: change.newValue
          })
        }

        // Notify users tracking this grant
        const { data: trackers } = await supabase
          .from('grant_progress')
          .select('user_id')
          .eq('grant_id', result.grantId)
          .not('status', 'in', '("submitted","successful","unsuccessful")')

        if (trackers?.length > 0) {
          const grant = grants.find(g => g.id === result.grantId)
          const notifications = trackers.map(t => ({
            user_id: t.user_id,
            type: 'update',
            title: `Grant Updated: ${grant?.name || result.grantId}`,
            message: `Changes detected: ${changes.map(c => c.field).join(', ')}`,
            grant_id: result.grantId
          }))
          await supabase.from('notifications').insert(notifications)
        }
      }
    }
  } catch (error) {
    results.success = false
    results.error = error.message
  }

  return Response.json(results)
}
