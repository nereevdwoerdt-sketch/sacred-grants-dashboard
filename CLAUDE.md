# Sacred Grants Dashboard - Project Context

## Quick Reference

**Live Dashboard:** https://sacred-grants-dashboard.vercel.app/dashboard

**Repositories:**
- GitHub: https://github.com/nereevdwoerdt-sketch/sacred-grants-dashboard
- Local: `/Users/nereevanderwoerdt/Documents/SACRED FOUNDATION/sacred-grants-dashboard/`

**Sacred Bible:** `/Users/nereevanderwoerdt/Documents/Sacred_Foundation_Bible_v3.docx`

---

## Sacred Foundation - Complete Profile

### Legal Entities

**Australia:**
- **Company:** Sacred Taste Pty Ltd
- **Trading As:** Sacred / Sacred Taste
- **Location:** Melbourne, Victoria
- **Founded:** 2017 (home kitchen), formalized 2019
- **Phone:** (03) 9120 7700
- **Website:** sacredtaste.com

**Europe (In Progress):**
- **Foundation:** Sacred Foundation EU
- **Legal Form:** Stichting (Dutch Foundation)
- **Municipality:** Weststellingwerf, Netherlands
- **Status:** In formation - ANBI status planned
- **Board Chair:** Neree van der Woerdt
- **Board Member:** Daniel Koch (upon appointment)

### What Sacred Does

1. **Imports & Processes Cacao**
   - Sources ceremonial-grade Criollo cacao from Ashaninka communities in Peru
   - **Processes cacao in Australia** via contract manufacturer
   - Creates powder blends and mixes (NOT just import - actual food production)

2. **Product Line (5 SKUs)**
   - EARTH - Original Cacao (250g, 1kg)
   - FIRE - Chilli Cacao (cayenne, cinnamon)
   - LOVE - Rose Cacao (rose petal powder)
   - VITALITY - Matcha & Mint Cacao
   - CEREMONY - 100% Pure Ceremonial Grade
   - RTD Cans - Coming soon (cashew & coconut mylk)

3. **Events & Services**
   - New Moon Cacao Ceremonies
   - Full Moon Cacao Parties
   - Sacred Cacao Bar (roving bar for events)
   - Corporate Cacao Ceremonies
   - Online programs & courses

### The Ashaninka Partnership

- **People:** Ashaninka - oldest Indigenous tribe in the Amazon
- **Location:** Rio Ene, Junín region, Peru (VRAEM)
- **Communities:** 22 communities
- **Families Supported:** 300+
- **Land Secured:** 95% of territory now has legal titles
- **Cacao:** Heirloom Criollo (only 5-10% of world production)
- **Award:** Equator Prize 2019 (UN Development Program)

### Key Impact Numbers

- 1,200 acres Amazon rainforest saved (Rainforest Trust)
- 300+ Indigenous families supported
- 22 communities along Rio Ene
- 100+ stockists across Australia
- 5+ international markets (AU, NZ, Switzerland, Malaysia, Middle East)

### Retail Partners (2023)

- Ritchies IGA (78 stores)
- David Jones (6 stores)
- Monoprix Middle East (700+ stores)
- Health 2000 New Zealand (52 stores)

### Core Team

- **Dan Koch** - Founder & CEO (former Trance DJ)
- **Thu Nguyen** - COO & CFO
- **Edward Jayhan** - Head of Marketing
- **Neree van der Woerdt** - Foundation Board Chair

---

## Grant Eligibility Summary

| Grant Type | Entity | Eligible? |
|------------|--------|-----------|
| Australian Pty Ltd grants | Sacred Taste Pty Ltd | ✅ Yes |
| Food/grocery innovation | Sacred Taste Pty Ltd | ✅ Yes (processes cacao in AU) |
| Export grants (EMDG) | Sacred Taste Pty Ltd | ✅ Yes |
| Dutch Stichting grants | Sacred Foundation EU | ⏳ When formed |
| NFP/DGR grants | - | ❌ Need NFP status |
| Individual artist grants | Team members | ✅ Possible |

### Key Grant Angles

1. **Food Innovation** - Cacao processing, healthy alternatives to alcohol
2. **Cultural Diplomacy** - AU-Peru connection, Ashaninka partnership
3. **Mental Health** - Ceremonies for wellbeing, loneliness epidemic
4. **Sustainability** - Rainforest protection, ethical sourcing
5. **Indigenous Rights** - Land titles, cultural preservation
6. **Documentary** - Ashaninka story, Dan's Amazon journey

---

## Credentials & Access

### Supabase
- **Project ID:** `iywghhqmohgvosnvtnlu`
- **URL:** `https://iywghhqmohgvosnvtnlu.supabase.co`
- **Keys:** In `.env.local`

### Vercel
- **Project:** sacred-grants-dashboard
- **Team:** nerees-projects
- **Auto-deploy:** From GitHub main branch

---

## Database Structure (Supabase)

| Table | Purpose |
|-------|---------|
| `discovered_grants` | Grants found by crawler |
| `grant_cache` | Cached grant page data |
| `grant_progress` | User progress per grant |
| `grant_updates` | Change tracking |
| `discovery_runs` | Crawler run history |
| `notifications` | User notifications |

---

## Key Files

### Grants Data
- `lib/grants-data.js` - All 90+ grants with metadata

### Crawler/Discovery
- `lib/discovery-config.js` - Sacred-specific keywords & sources
- `lib/grant-discovery.js` - Discovery logic
- `lib/scraper.js` - Web scraping

### API Routes (Cron Jobs)
- `/api/cron/check-deadlines` - Daily 8:00
- `/api/cron/update-grants` - Weekly Sunday 00:00
- `/api/cron/discover-grants` - Weekly Wednesday 02:00

---

## Common Tasks

### Add new grant
Edit `lib/grants-data.js` and add to grants array.

### Run crawler
Visit `/api/discovery/run` or trigger from dashboard.

### Deploy changes
Push to GitHub main → Vercel auto-deploys.

---

## Troubleshooting

- **Dashboard not loading:** Check `.env.local` Supabase keys
- **Crawler errors:** Check `discovery_runs.errors` in Supabase
- **Deployment failed:** Check Vercel build logs

---

*Last updated: 2026-01-29*
*Source: Sacred_Foundation_Bible_v3.docx*
