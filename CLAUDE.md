# Sacred Grants Dashboard - Project Context

## Quick Reference

**Live Dashboard:** https://sacred-grants-dashboard.vercel.app/dashboard

**Repositories:**
- GitHub: https://github.com/nereevdwoerdt-sketch/sacred-grants-dashboard
- Local: `/Users/nereevanderwoerdt/Documents/SACRED FOUNDATION/sacred-grants-dashboard/`

## Credentials & Access

### Supabase
- **Project ID:** `iywghhqmohgvosnvtnlu`
- **URL:** `https://iywghhqmohgvosnvtnlu.supabase.co`
- **Keys:** In `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

### Vercel
- **Project:** sacred-grants-dashboard
- **Team:** nerees-projects
- **Auto-deploy:** From GitHub main branch

## Database Structure (Supabase)

| Table | Purpose |
|-------|---------|
| `discovered_grants` | Grants found by crawler |
| `grant_cache` | Cached grant page data |
| `grant_progress` | User progress per grant |
| `grant_updates` | Change tracking |
| `discovery_runs` | Crawler run history |
| `notifications` | User notifications |

## Key Files

### Grants Data
- `lib/grants-data.js` - **All 45+ grants** with full metadata (region, eligibility, deadlines, Sacred fit analysis)

### Crawler/Discovery
- `lib/discovery-config.js` - Keywords & sources for finding grants (Sacred-specific)
- `lib/grant-discovery.js` - Discovery logic
- `lib/scraper.js` - Web scraping logic

### API Routes (Cron Jobs)
- `/api/cron/check-deadlines` - Daily at 8:00
- `/api/cron/update-grants` - Weekly Sunday 00:00
- `/api/cron/discover-grants` - Weekly Wednesday 02:00

## Grant Regions

| Region | Count | Focus |
|--------|-------|-------|
| Australia (au) | 9 | Pty Ltd eligible, DFAT, Creative Australia |
| Netherlands (nl) | 14 | Stichting/NFP, Mondriaan, DOEN, Cultuurparticipatie |
| EU | 12 | Creative Europe, Erasmus+, Horizon |
| Peru/LatAm | 8 | Indigenous, IAF, Cultural Survival |
| International | 2 | UNESCO, Global funds |

## Sacred Foundation Context

**What Sacred Does:**
- Imports ceremonial-grade cacao from Ashaninka communities in Peru
- Hosts cacao ceremonies for mental health & community connection
- Bridges Australian and Peruvian indigenous traditions

**Key Grant Angles:**
1. Cultural diplomacy (AU-Peru connection)
2. Mental health through ceremony
3. Sustainable/ethical cacao sourcing
4. Indigenous cultural preservation
5. Documentary potential (Ashaninka story)

**Entity Types:**
- Australia: Sacred Taste Pty Ltd
- Netherlands: Stichting (in progress)
- Need NFP/DGR status for some grants

## Common Tasks

### Add new grant
Edit `lib/grants-data.js` and add to the grants array with all fields.

### Run crawler manually
Visit `/api/discovery/run` or trigger from dashboard.

### Check crawler status
Query `discovery_runs` table in Supabase.

### Deploy changes
Push to GitHub main branch - Vercel auto-deploys.

## Troubleshooting

### Dashboard not loading
Check Supabase connection in `.env.local`

### Crawler errors
Check `discovery_runs.errors` in Supabase

### Vercel deployment failed
Check build logs in Vercel dashboard

---
*Last updated: 2026-01-29*
