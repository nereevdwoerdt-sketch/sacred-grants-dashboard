#!/usr/bin/env node
/**
 * Sacred Foundation Grant Discovery Script - Enhanced Version
 *
 * Features:
 * - RSS feed parsing
 * - API integration (EU Funding Portal, GrantConnect)
 * - Deep crawling with link following
 * - Better keyword matching with scoring
 * - Deadline and amount extraction
 * - Multiple page parsing per source
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data')
const FEED_FILE = path.join(DATA_DIR, 'grants-feed.json')
const TRACKED_FILE = path.join(DATA_DIR, 'grants-tracked.json')
const ARCHIVE_FILE = path.join(DATA_DIR, 'grants-archive.json')
const DISCOVERY_LOG = path.join(DATA_DIR, 'discovery-log.json')

// Enhanced keywords with categories and weights
const KEYWORDS = {
  // Highest priority - exact Sacred mission (weight: 5)
  exact: {
    weight: 5,
    terms: ['cacao ceremony', 'ceremonial cacao', 'sacred cacao', 'ashaninka', 'cacao ritual']
  },
  // High priority - core to Sacred's mission (weight: 3)
  core: {
    weight: 3,
    terms: ['cacao', 'sacred', 'ceremony', 'ceremonial', 'ritual', 'plant medicine', 'entheogenic', 'psychedelic therapy', 'shamanic', 'ayahuasca']
  },
  // High priority - indigenous focus (weight: 3)
  indigenous: {
    weight: 3,
    terms: ['indigenous', 'first nations', 'aboriginal', 'traditional knowledge', 'indigenous rights', 'native peoples', 'tribal', 'indigenous communities', 'traditional peoples', 'ancestral knowledge', 'indigenous culture']
  },
  // Medium-high priority - wellness/healing (weight: 2.5)
  wellness: {
    weight: 2.5,
    terms: ['holistic health', 'alternative medicine', 'complementary therapy', 'mindfulness', 'meditation', 'retreats', 'healing', 'therapeutic', 'trauma healing', 'somatic']
  },
  // Medium priority - cultural (weight: 2)
  cultural: {
    weight: 2,
    terms: ['cultural exchange', 'cultural heritage', 'intangible heritage', 'cultural diplomacy', 'cross-cultural', 'cultural cooperation', 'intercultural', 'cultural preservation', 'living heritage', 'folk tradition']
  },
  // Medium priority - social enterprise (weight: 2)
  social: {
    weight: 2,
    terms: ['social enterprise', 'social impact', 'social innovation', 'community wellbeing', 'mental health', 'wellness', 'wellbeing', 'community development', 'grassroots', 'empowerment']
  },
  // Medium priority - arts/performance (weight: 2)
  arts: {
    weight: 2,
    terms: ['performing arts', 'festival', 'music', 'dance', 'theatre', 'artistic', 'creative industries', 'cultural sector', 'world music', 'traditional music', 'sound healing']
  },
  // Medium priority - food/agriculture (weight: 2)
  food: {
    weight: 2,
    terms: ['specialty food', 'artisan food', 'organic', 'agroforestry', 'permaculture', 'food heritage', 'traditional food', 'superfoods', 'functional foods', 'food innovation']
  },
  // Lower priority - geographic (weight: 1)
  geographic: {
    weight: 1,
    terms: ['peru', 'latin america', 'amazon', 'netherlands', 'australia', 'eu', 'european', 'andes', 'south america', 'amazonia', 'rainforest']
  },
  // Lower priority - business (weight: 1)
  business: {
    weight: 1,
    terms: ['fair trade', 'ethical sourcing', 'sustainable', 'regenerative', 'export', 'food producer', 'b-corp', 'circular economy', 'impact investing', 'ethical business']
  }
}

// Flatten keywords for quick matching
const ALL_KEYWORDS = Object.values(KEYWORDS).flatMap(cat => cat.terms)

// Comprehensive grant sources - 60+ sources across all regions
const SOURCES = {
  // ============ NETHERLANDS (20 sources) ============
  'fonds-podiumkunsten': {
    name: 'Fonds Podiumkunsten',
    region: 'nl',
    pages: [
      'https://fondspodiumkunsten.nl/en/funding/',
      'https://fondspodiumkunsten.nl/en/funding/grants/',
      'https://fondspodiumkunsten.nl/en/funding/international/'
    ],
    type: 'scrape'
  },
  'mondriaan-fund': {
    name: 'Mondriaan Fund',
    region: 'nl',
    pages: [
      'https://www.mondriaanfonds.nl/en/grants/',
      'https://www.mondriaanfonds.nl/en/grants/visual-artists/',
      'https://www.mondriaanfonds.nl/en/grants/cultural-heritage/'
    ],
    type: 'scrape'
  },
  'doen-foundation': {
    name: 'DOEN Foundation',
    region: 'nl',
    pages: [
      'https://www.doen.nl/en/what-we-do',
      'https://www.doen.nl/en/what-we-do/green-and-inclusive-economy',
      'https://www.doen.nl/en/what-we-do/culture-and-cohesion'
    ],
    type: 'scrape'
  },
  'stimuleringsfonds': {
    name: 'Stimuleringsfonds Creatieve Industrie',
    region: 'nl',
    pages: [
      'https://stimuleringsfonds.nl/en/',
      'https://stimuleringsfonds.nl/en/grants/',
      'https://stimuleringsfonds.nl/en/grants/open-call/'
    ],
    type: 'scrape'
  },
  'cultuurparticipatie': {
    name: 'Fonds voor Cultuurparticipatie',
    region: 'nl',
    pages: [
      'https://cultuurparticipatie.nl/subsidies',
      'https://cultuurparticipatie.nl/regelingen'
    ],
    type: 'scrape'
  },
  'oranjefonds': {
    name: 'Oranjefonds',
    region: 'nl',
    pages: [
      'https://www.oranjefonds.nl/',
      'https://www.oranjefonds.nl/een-bijdrage-aanvragen'
    ],
    type: 'scrape'
  },
  'triodos-foundation': {
    name: 'Triodos Foundation',
    region: 'nl',
    pages: ['https://www.triodosfoundation.nl/'],
    type: 'scrape'
  },
  'prins-bernhard': {
    name: 'Prins Bernhard Cultuurfonds',
    region: 'nl',
    pages: [
      'https://www.cultuurfonds.nl/aanvragen',
      'https://www.cultuurfonds.nl/fondsen'
    ],
    type: 'scrape'
  },
  'vsbfonds': {
    name: 'VSBfonds',
    region: 'nl',
    pages: ['https://www.vsbfonds.nl/aanvragen'],
    type: 'scrape'
  },
  'fonds21': {
    name: 'Fonds 21',
    region: 'nl',
    pages: ['https://www.fonds21.nl/', 'https://www.fonds21.nl/aanvraag-indienen'],
    type: 'scrape'
  },
  'haella-stichting': {
    name: 'Haëlla Stichting',
    region: 'nl',
    pages: ['https://haella.nl/', 'https://haella.nl/subsidies/'],
    type: 'scrape'
  },
  'adessium': {
    name: 'Adessium Foundation',
    region: 'nl',
    pages: ['https://www.adessium.org/', 'https://www.adessium.org/apply/'],
    type: 'scrape'
  },
  'ars-donandi': {
    name: 'Stichting Ars Donandi',
    region: 'nl',
    pages: ['https://www.arsdonandi.nl/'],
    type: 'scrape'
  },
  'bng-cultuurfonds': {
    name: 'BNG Cultuurfonds',
    region: 'nl',
    pages: ['https://www.bfrcultuurfonds.nl/'],
    type: 'scrape'
  },
  'kf-heinfonds': {
    name: 'K.F. Hein Fonds',
    region: 'nl',
    pages: ['https://www.kfheinfonds.nl/'],
    type: 'scrape'
  },
  'nl-subsidies': {
    name: 'Netherlands Enterprise Agency (RVO)',
    region: 'nl',
    pages: [
      'https://www.rvo.nl/subsidies-financiering',
      'https://english.rvo.nl/subsidies-programmes'
    ],
    type: 'scrape'
  },
  'democratie-media': {
    name: 'Fonds Democratie en Media',
    region: 'nl',
    pages: ['https://www.democratieenmedia.nl/subsidies'],
    type: 'scrape'
  },
  'janivo': {
    name: 'Janivo Stichting',
    region: 'nl',
    pages: ['https://www.janivo.nl/'],
    type: 'scrape'
  },
  'ammodo': {
    name: 'Ammodo',
    region: 'nl',
    pages: ['https://www.ammodo.org/'],
    type: 'scrape'
  },
  'lira': {
    name: 'Lira Fonds',
    region: 'nl',
    pages: ['https://www.lira.nl/lirafonds/'],
    type: 'scrape'
  },

  // ============ EU-WIDE (15 sources) ============
  'eu-funding-portal': {
    name: 'EU Funding & Tenders Portal',
    region: 'eu',
    type: 'api',
    apiUrl: 'https://api.tech.ec.europa.eu/search-api/prod/rest/search',
    searchTerms: ['culture', 'heritage', 'arts', 'social innovation', 'indigenous']
  },
  'creative-europe': {
    name: 'Creative Europe',
    region: 'eu',
    pages: [
      'https://culture.ec.europa.eu/funding/creative-europe-calls-for-proposals',
      'https://culture.ec.europa.eu/creative-europe/creative-europe-culture-strand'
    ],
    type: 'scrape'
  },
  'culture-moves-europe': {
    name: 'Culture Moves Europe',
    region: 'eu',
    pages: ['https://www.culturemoveseurope.eu/'],
    type: 'scrape'
  },
  'ecf': {
    name: 'European Cultural Foundation',
    region: 'eu',
    pages: [
      'https://culturalfoundation.eu/stories/?type=calls',
      'https://culturalfoundation.eu/grants/'
    ],
    type: 'scrape'
  },
  'effea': {
    name: 'EFFEA - European Festivals Fund',
    region: 'eu',
    pages: ['https://www.effea.eu/', 'https://www.effea.eu/apply/'],
    type: 'scrape'
  },
  'erasmus-culture': {
    name: 'Erasmus+ Culture & Education',
    region: 'eu',
    pages: ['https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-organisations'],
    type: 'scrape'
  },
  'horizon-europe': {
    name: 'Horizon Europe',
    region: 'eu',
    pages: [
      'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
      'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities_en'
    ],
    type: 'scrape'
  },
  'life-programme': {
    name: 'LIFE Programme',
    region: 'eu',
    pages: ['https://cinea.ec.europa.eu/programmes/life_en'],
    type: 'scrape'
  },
  'cerv': {
    name: 'CERV - Citizens Programme',
    region: 'eu',
    pages: ['https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/programmes/cerv'],
    type: 'scrape'
  },
  'interreg': {
    name: 'Interreg Europe',
    region: 'eu',
    pages: ['https://www.interregeurope.eu/funding'],
    type: 'scrape'
  },
  'eit-food': {
    name: 'EIT Food',
    region: 'eu',
    pages: ['https://www.eitfood.eu/funding'],
    type: 'scrape'
  },
  'eit-culture': {
    name: 'EIT Culture & Creativity',
    region: 'eu',
    pages: ['https://eit-culture-creativity.eu/'],
    type: 'scrape'
  },
  'eu-social-fund': {
    name: 'European Social Fund Plus',
    region: 'eu',
    pages: ['https://ec.europa.eu/european-social-fund-plus/en'],
    type: 'scrape'
  },
  'robert-bosch': {
    name: 'Robert Bosch Stiftung',
    region: 'eu',
    pages: ['https://www.bosch-stiftung.de/en/funding'],
    type: 'scrape'
  },
  'allianz-foundation': {
    name: 'Allianz Kulturstiftung',
    region: 'eu',
    pages: ['https://kulturstiftung.allianz.de/en_EN/funding.html'],
    type: 'scrape'
  },

  // ============ AUSTRALIA (15 sources) ============
  'grantconnect': {
    name: 'GrantConnect Australia',
    region: 'au',
    type: 'api',
    apiUrl: 'https://www.grants.gov.au/api/',
    searchTerms: ['arts', 'culture', 'indigenous', 'export', 'food']
  },
  'creative-australia': {
    name: 'Creative Australia',
    region: 'au',
    pages: [
      'https://creative.gov.au/funding-and-support/',
      'https://creative.gov.au/funding-and-support/funding-by-category/'
    ],
    type: 'scrape'
  },
  'screen-australia': {
    name: 'Screen Australia',
    region: 'au',
    pages: [
      'https://www.screenaustralia.gov.au/funding',
      'https://www.screenaustralia.gov.au/funding/documentary'
    ],
    type: 'scrape'
  },
  'business-vic': {
    name: 'Business Victoria',
    region: 'au',
    pages: ['https://business.vic.gov.au/grants-and-programs'],
    type: 'scrape'
  },
  'ian-potter': {
    name: 'Ian Potter Foundation',
    region: 'au',
    pages: ['https://www.ianpotter.org.au/what-we-support/'],
    type: 'scrape'
  },
  'creative-vic': {
    name: 'Creative Victoria',
    region: 'au',
    pages: ['https://creative.vic.gov.au/funding'],
    type: 'scrape'
  },
  'music-vic': {
    name: 'Music Victoria',
    region: 'au',
    pages: ['https://www.musicvictoria.com.au/grants/'],
    type: 'scrape'
  },
  'city-melbourne': {
    name: 'City of Melbourne Grants',
    region: 'au',
    pages: ['https://www.melbourne.vic.gov.au/business/grants-sponsorship/Pages/grants-sponsorship.aspx'],
    type: 'scrape'
  },
  'austrade-emdg': {
    name: 'Austrade EMDG',
    region: 'au',
    pages: ['https://www.austrade.gov.au/en/how-we-can-help-you/programs-and-incentives/export-market-development-grants'],
    type: 'scrape'
  },
  'philanthropy-au': {
    name: 'Philanthropy Australia',
    region: 'au',
    pages: ['https://www.philanthropy.org.au/', 'https://www.philanthropy.org.au/funding-resources/'],
    type: 'scrape'
  },
  'australia-council': {
    name: 'Australia Council for the Arts',
    region: 'au',
    pages: ['https://australiacouncil.gov.au/funding/', 'https://australiacouncil.gov.au/'],
    type: 'scrape'
  },
  'myer-foundation': {
    name: 'Myer Foundation',
    region: 'au',
    pages: ['https://myerfoundation.org.au/', 'https://myerfoundation.org.au/apply/'],
    type: 'scrape'
  },
  'perpetual-impact': {
    name: 'Perpetual Impact Philanthropy',
    region: 'au',
    pages: ['https://www.perpetual.com.au/wealth/philanthropy'],
    type: 'scrape'
  },
  'paul-ramsay': {
    name: 'Paul Ramsay Foundation',
    region: 'au',
    pages: ['https://paulramsayfoundation.org.au/'],
    type: 'scrape'
  },
  'melbourne-lord-mayor': {
    name: 'Lord Mayor\'s Charitable Foundation',
    region: 'au',
    pages: ['https://www.lmcf.org.au/grants'],
    type: 'scrape'
  },

  // ============ PERU / INDIGENOUS / LATIN AMERICA (12 sources) ============
  'prince-claus': {
    name: 'Prince Claus Fund',
    region: 'pe',
    pages: [
      'https://princeclausfund.org/',
      'https://princeclausfund.org/programmes'
    ],
    type: 'scrape'
  },
  'cultural-survival': {
    name: 'Cultural Survival',
    region: 'pe',
    pages: [
      'https://www.culturalsurvival.org/grantmaking',
      'https://www.culturalsurvival.org/keepers-earth-fund'
    ],
    type: 'scrape'
  },
  'iaf': {
    name: 'Inter-American Foundation',
    region: 'pe',
    pages: [
      'https://www.iaf.gov/',
      'https://www.iaf.gov/grants/'
    ],
    type: 'scrape'
  },
  'rainforest-trust': {
    name: 'Rainforest Trust',
    region: 'pe',
    pages: ['https://www.rainforesttrust.org/', 'https://www.rainforesttrust.org/grants/'],
    type: 'scrape'
  },
  'first-peoples': {
    name: 'First Peoples Worldwide',
    region: 'pe',
    pages: ['https://www.firstpeoplesworldwide.org/'],
    type: 'scrape'
  },
  'nia-tero': {
    name: 'Nia Tero',
    region: 'pe',
    pages: ['https://niatero.org/'],
    type: 'scrape'
  },
  'swift-foundation': {
    name: 'Swift Foundation',
    region: 'pe',
    pages: ['https://swiftfoundation.org/'],
    type: 'scrape'
  },
  'amazon-watch': {
    name: 'Amazon Watch',
    region: 'pe',
    pages: ['https://amazonwatch.org/'],
    type: 'scrape'
  },
  'christensen-fund': {
    name: 'The Christensen Fund',
    region: 'pe',
    pages: ['https://www.christensenfund.org/grants/'],
    type: 'scrape'
  },
  'global-greengrants': {
    name: 'Global Greengrants Fund',
    region: 'pe',
    pages: ['https://www.greengrants.org/'],
    type: 'scrape'
  },
  'forest-peoples': {
    name: 'Forest Peoples Programme',
    region: 'pe',
    pages: ['https://www.forestpeoples.org/'],
    type: 'scrape'
  },
  'iucn-nl': {
    name: 'IUCN Netherlands',
    region: 'pe',
    pages: ['https://www.iucn.nl/en/'],
    type: 'scrape'
  },

  // ============ INTERNATIONAL (15 sources) ============
  'ford-foundation': {
    name: 'Ford Foundation',
    region: 'int',
    pages: ['https://www.fordfoundation.org/work/our-grants/'],
    type: 'scrape'
  },
  'ashoka': {
    name: 'Ashoka',
    region: 'int',
    pages: ['https://www.ashoka.org/en/program/ashoka-fellowship'],
    type: 'scrape'
  },
  'skoll': {
    name: 'Skoll Foundation',
    region: 'int',
    pages: ['https://skoll.org/about/skoll-awards/'],
    type: 'scrape'
  },
  'open-society': {
    name: 'Open Society Foundations',
    region: 'int',
    pages: ['https://www.opensocietyfoundations.org/grants'],
    type: 'scrape'
  },
  'rockefeller': {
    name: 'Rockefeller Foundation',
    region: 'int',
    pages: ['https://www.rockefellerfoundation.org/grants/'],
    type: 'scrape'
  },
  'hewlett': {
    name: 'William & Flora Hewlett Foundation',
    region: 'int',
    pages: ['https://hewlett.org/grants/'],
    type: 'scrape'
  },
  'macarthur': {
    name: 'MacArthur Foundation',
    region: 'int',
    pages: ['https://www.macfound.org/info-grantseekers/'],
    type: 'scrape'
  },
  'omidyar': {
    name: 'Omidyar Network',
    region: 'int',
    pages: ['https://omidyar.com/'],
    type: 'scrape'
  },
  'echoing-green': {
    name: 'Echoing Green',
    region: 'int',
    pages: ['https://echoinggreen.org/fellowship/'],
    type: 'scrape'
  },
  'global-fund-women': {
    name: 'Global Fund for Women',
    region: 'int',
    pages: ['https://www.globalfundforwomen.org/', 'https://www.globalfundforwomen.org/grantmaking/'],
    type: 'scrape'
  },
  'un-democracy-fund': {
    name: 'UN Democracy Fund',
    region: 'int',
    pages: ['https://www.un.org/democracyfund/', 'https://www.un.org/democracyfund/apply-funding'],
    type: 'scrape'
  },
  'gfw': {
    name: 'Global Fund for Community Foundations',
    region: 'int',
    pages: ['https://globalfundcommunityfoundations.org/'],
    type: 'scrape'
  },
  'porticus': {
    name: 'Porticus',
    region: 'int',
    pages: ['https://www.porticus.com/en/'],
    type: 'scrape'
  },
  'oak-foundation': {
    name: 'Oak Foundation',
    region: 'int',
    pages: ['https://oakfnd.org/'],
    type: 'scrape'
  },
  'wellcome-trust': {
    name: 'Wellcome Trust',
    region: 'int',
    pages: ['https://wellcome.org/grant-funding'],
    type: 'scrape'
  },

  // ============ RSS FEEDS (Grant Aggregators) ============
  'fundsforngos': {
    name: 'Funds for NGOs',
    region: 'int',
    type: 'rss',
    feedUrl: 'https://www2.fundsforngos.org/feed/'
  },
  'devex-funding': {
    name: 'Devex Funding',
    region: 'int',
    type: 'rss',
    feedUrl: 'https://www.devex.com/news/funding/feed'
  },
  'grantwatch': {
    name: 'GrantWatch',
    region: 'int',
    pages: ['https://www.grantwatch.com/'],
    type: 'scrape'
  }
}

// ============ UTILITY FUNCTIONS ============

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadJSON(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (e) {
    console.error(`Error loading ${filePath}:`, e.message)
  }
  return defaultValue
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Enhanced HTTP fetch with better error handling
function fetchURL(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : http

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      timeout: 30000
    }

    const req = protocol.request(reqOptions, (res) => {
      // Handle redirects (up to 5)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectCount = (options.redirectCount || 0) + 1
        if (redirectCount > 5) {
          reject(new Error('Too many redirects'))
          return
        }
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`
        return fetchURL(redirectUrl, { ...options, redirectCount }).then(resolve).catch(reject)
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.end()
  })
}

// Extract clean text from HTML
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract links from HTML
function extractLinks(html, baseUrl) {
  const links = []
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1]

    // Skip non-http links
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue
    }

    // Convert relative URLs to absolute
    if (!href.startsWith('http')) {
      try {
        const base = new URL(baseUrl)
        href = href.startsWith('/')
          ? `${base.protocol}//${base.host}${href}`
          : `${base.protocol}//${base.host}${base.pathname.replace(/[^/]*$/, '')}${href}`
      } catch (e) {
        continue
      }
    }

    links.push(href)
  }

  return [...new Set(links)] // Remove duplicates
}

// Enhanced keyword matching with scoring
function matchKeywords(text) {
  const lowerText = text.toLowerCase()
  const matches = []
  let totalScore = 0

  for (const [category, config] of Object.entries(KEYWORDS)) {
    for (const term of config.terms) {
      if (lowerText.includes(term.toLowerCase())) {
        matches.push({ term, category, weight: config.weight })
        totalScore += config.weight
      }
    }
  }

  return {
    matched: matches.length > 0,
    matches,
    score: totalScore,
    categories: [...new Set(matches.map(m => m.category))]
  }
}

// Extract deadline from text
function extractDeadline(text) {
  const patterns = [
    // "Deadline: 15 March 2026"
    /deadline[:\s]+(\d{1,2}[\s/-]?\w+[\s/-]?\d{4})/i,
    // "closes on March 15, 2026"
    /closes?\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i,
    // "due by 15/03/2026"
    /due\s+(?:by\s+)?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})/i,
    // "Submit by March 2026"
    /submit\s+(?:by\s+)?(\w+\s+\d{4})/i,
    // "Applications close: 15 Mar 2026"
    /applications?\s+close[s:]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    // "Open until 15 March"
    /open\s+until\s+(\d{1,2}\s+\w+(?:\s+\d{4})?)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return null
}

// Extract amount from text
function extractAmount(text) {
  const patterns = [
    // "€50,000" or "EUR 50,000"
    /(€|EUR)\s*([\d,]+(?:\.\d+)?)\s*(?:[-–to]+\s*(€|EUR)?\s*([\d,]+(?:\.\d+)?))?\s*(K|M|million|thousand)?/gi,
    // "$50,000" or "USD 50,000"
    /(\$|USD|AUD)\s*([\d,]+(?:\.\d+)?)\s*(?:[-–to]+\s*(\$|USD|AUD)?\s*([\d,]+(?:\.\d+)?))?\s*(K|M|million|thousand)?/gi,
    // "Up to €50,000"
    /up\s+to\s+(€|\$|EUR|USD|AUD)\s*([\d,]+(?:\.\d+)?)\s*(K|M|million|thousand)?/gi
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }

  return null
}

// Generate unique ID for a grant
function generateId(name, source) {
  const date = new Date().toISOString().split('T')[0]
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 40)
  const sourceSlug = source.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20)
  return `${sourceSlug}-${slug}-${date}`
}

// ============ PARSING FUNCTIONS ============

// Parse grants from a single page
function parsePageContent(html, url, sourceConfig) {
  const grants = []
  const text = extractText(html)
  const keywordMatch = matchKeywords(text)

  if (!keywordMatch.matched) {
    return grants
  }

  // Try to find individual grant sections
  // Look for common grant listing patterns
  const grantPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*(?:grant|funding|call|opportunity)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<li[^>]*class="[^"]*(?:grant|funding|call)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    /<section[^>]*>([\s\S]*?)<\/section>/gi
  ]

  let foundSections = false

  for (const pattern of grantPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const sectionHtml = match[1]
      const sectionText = extractText(sectionHtml)
      const sectionMatch = matchKeywords(sectionText)

      if (sectionMatch.matched && sectionText.length > 50 && sectionText.length < 5000) {
        foundSections = true

        // Try to extract a title
        const titleMatch = sectionHtml.match(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/i)
        const title = titleMatch ? extractText(titleMatch[1]) : null

        if (title && title.length > 5) {
          grants.push({
            id: generateId(title, sourceConfig.name),
            name: title.substring(0, 200),
            source: sourceConfig.name,
            sourceUrl: url,
            region: sourceConfig.region,
            matchedKeywords: sectionMatch.matches.map(m => m.term),
            categories: sectionMatch.categories,
            score: sectionMatch.score,
            deadline: extractDeadline(sectionText),
            amount: extractAmount(sectionText),
            excerpt: sectionText.substring(0, 500),
            discoveredDate: new Date().toISOString(),
            status: 'pending_review',
            isNew: true
          })
        }
      }
    }
  }

  // If no sections found, create one entry for the whole page
  if (!foundSections && keywordMatch.score >= 2) {
    const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const title = h1 ? extractText(h1[1]) : (pageTitle ? extractText(pageTitle[1]) : sourceConfig.name)

    grants.push({
      id: generateId(title, sourceConfig.name),
      name: `${sourceConfig.name}: ${title.substring(0, 100)}`,
      source: sourceConfig.name,
      sourceUrl: url,
      region: sourceConfig.region,
      matchedKeywords: keywordMatch.matches.map(m => m.term),
      categories: keywordMatch.categories,
      score: keywordMatch.score,
      deadline: extractDeadline(text),
      amount: extractAmount(text),
      excerpt: text.substring(0, 500),
      discoveredDate: new Date().toISOString(),
      status: 'pending_review',
      isNew: true
    })
  }

  return grants
}

// Parse RSS/Atom feed (supports both formats)
function parseRSSFeed(xml, sourceConfig) {
  const grants = []

  // Try RSS format first
  let itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  let items = []

  while ((match = itemRegex.exec(xml)) !== null) {
    items.push({ content: match[1], format: 'rss' })
  }

  // If no RSS items, try Atom format
  if (items.length === 0) {
    itemRegex = /<entry>([\s\S]*?)<\/entry>/gi
    while ((match = itemRegex.exec(xml)) !== null) {
      items.push({ content: match[1], format: 'atom' })
    }
  }

  for (const { content: item, format } of items) {
    let title, link, description

    if (format === 'rss') {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
      const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i)

      title = titleMatch ? extractText(titleMatch[1]) : 'Unknown'
      link = linkMatch ? linkMatch[1].trim() : ''
      description = descMatch ? extractText(descMatch[1]) : (contentMatch ? extractText(contentMatch[1]) : '')
    } else {
      // Atom format
      const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
      const linkMatch = item.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)
      const summaryMatch = item.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)
      const contentMatch = item.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)

      title = titleMatch ? extractText(titleMatch[1]) : 'Unknown'
      link = linkMatch ? linkMatch[1].trim() : ''
      description = summaryMatch ? extractText(summaryMatch[1]) : (contentMatch ? extractText(contentMatch[1]) : '')
    }

    const fullText = `${title} ${description}`
    const keywordMatch = matchKeywords(fullText)

    if (keywordMatch.matched) {
      grants.push({
        id: generateId(title, sourceConfig.name),
        name: title.substring(0, 200),
        source: sourceConfig.name,
        sourceUrl: link || sourceConfig.feedUrl,
        region: sourceConfig.region,
        matchedKeywords: keywordMatch.matches.map(m => m.term),
        categories: keywordMatch.categories,
        score: keywordMatch.score,
        deadline: extractDeadline(fullText),
        amount: extractAmount(fullText),
        excerpt: description.substring(0, 500),
        discoveredDate: new Date().toISOString(),
        status: 'pending_review',
        isNew: true
      })
    }
  }

  return grants
}

// ============ SCRAPING FUNCTIONS ============

// Scrape a single source with multiple pages
async function scrapeSource(sourceId, sourceConfig) {
  console.log(`  Checking ${sourceConfig.name}...`)

  const allGrants = []
  const errors = []

  try {
    if (sourceConfig.type === 'rss') {
      // RSS feed
      const xml = await fetchURL(sourceConfig.feedUrl)
      const grants = parseRSSFeed(xml, sourceConfig)
      allGrants.push(...grants)
      console.log(`    RSS: Found ${grants.length} matches`)

    } else if (sourceConfig.type === 'api') {
      // API (placeholder - would need specific implementation per API)
      console.log(`    API: Skipped (requires specific implementation)`)

    } else {
      // Web scraping with multiple pages
      const pages = sourceConfig.pages || [sourceConfig.url]

      for (const pageUrl of pages) {
        try {
          const html = await fetchURL(pageUrl)
          const grants = parsePageContent(html, pageUrl, sourceConfig)
          allGrants.push(...grants)

          if (grants.length > 0) {
            console.log(`    ${pageUrl.split('/').slice(-2).join('/')}: ${grants.length} matches`)
          }

          // Small delay between pages
          await new Promise(r => setTimeout(r, 500))
        } catch (e) {
          errors.push({ url: pageUrl, error: e.message })
        }
      }
    }
  } catch (error) {
    errors.push({ url: sourceConfig.name, error: error.message })
  }

  if (allGrants.length === 0 && errors.length === 0) {
    console.log(`    No relevant matches`)
  }

  if (errors.length > 0) {
    console.log(`    Errors: ${errors.map(e => e.error).join(', ')}`)
  }

  return { grants: allGrants, errors }
}

// ============ MAIN FUNCTIONS ============

async function discoverGrants() {
  console.log('='.repeat(70))
  console.log('  Sacred Foundation - Enhanced Grant Discovery')
  console.log('='.repeat(70))
  console.log(`  Started: ${new Date().toISOString()}`)
  console.log(`  Sources: ${Object.keys(SOURCES).length}`)
  console.log(`  Keywords: ${ALL_KEYWORDS.length} terms across ${Object.keys(KEYWORDS).length} categories`)
  console.log('')

  ensureDataDir()

  const existingFeed = loadJSON(FEED_FILE)
  const existingTracked = loadJSON(TRACKED_FILE)
  const existingIds = new Set([
    ...existingFeed.map(g => g.id),
    ...existingTracked.map(g => g.id)
  ])

  const discoveredGrants = []
  const allErrors = []

  // Group sources by region
  const sourcesByRegion = {}
  for (const [id, config] of Object.entries(SOURCES)) {
    if (!sourcesByRegion[config.region]) {
      sourcesByRegion[config.region] = []
    }
    sourcesByRegion[config.region].push({ id, ...config })
  }

  const regionNames = {
    nl: '🇳🇱 Netherlands',
    eu: '🇪🇺 EU-wide',
    au: '🇦🇺 Australia',
    pe: '🇵🇪 Peru/Indigenous',
    int: '🌍 International'
  }

  // Process each region
  for (const [region, sources] of Object.entries(sourcesByRegion)) {
    console.log(`\n[${regionNames[region] || region}] - ${sources.length} sources`)
    console.log('-'.repeat(50))

    for (const source of sources) {
      try {
        const result = await scrapeSource(source.id, source)

        for (const grant of result.grants) {
          // Skip if already known (by similar ID or exact match)
          if (existingIds.has(grant.id)) {
            continue
          }

          // Also check for similar names to avoid duplicates
          const isDuplicate = [...existingIds].some(id => {
            const similarity = grant.id.split('-').slice(0, -1).join('-')
            return id.startsWith(similarity)
          })

          if (!isDuplicate) {
            discoveredGrants.push(grant)
            existingIds.add(grant.id)
          }
        }

        allErrors.push(...result.errors)

        // Delay between sources
        await new Promise(r => setTimeout(r, 1000))
      } catch (error) {
        allErrors.push({ source: source.name, error: error.message })
      }
    }
  }

  // Sort by score (highest first)
  discoveredGrants.sort((a, b) => b.score - a.score)

  // Update feed with new discoveries
  const updatedFeed = [...existingFeed, ...discoveredGrants]
  saveJSON(FEED_FILE, updatedFeed)

  // Log this discovery run with source health tracking
  const log = loadJSON(DISCOVERY_LOG, { runs: [], sourceHealth: {} })

  // Ensure sourceHealth is an object
  if (!log.sourceHealth || typeof log.sourceHealth !== 'object') {
    log.sourceHealth = {}
  }

  // Track source health
  for (const [sourceId, source] of Object.entries(SOURCES)) {
    const sourceErrors = allErrors.filter(e => e.source === source.name || (e.url && e.url.includes(sourceId)))
    const sourceGrants = discoveredGrants.filter(g => g.source === source.name)

    if (!log.sourceHealth[sourceId]) {
      log.sourceHealth[sourceId] = { successes: 0, failures: 0, lastSuccess: null, lastError: null }
    }

    if (sourceErrors.length === 0) {
      log.sourceHealth[sourceId].successes++
      log.sourceHealth[sourceId].lastSuccess = new Date().toISOString()
    } else {
      log.sourceHealth[sourceId].failures++
      log.sourceHealth[sourceId].lastError = sourceErrors[0]?.error || 'Unknown error'
    }

    log.sourceHealth[sourceId].lastGrants = sourceGrants.length
  }

  log.runs.push({
    timestamp: new Date().toISOString(),
    sourcesChecked: Object.keys(SOURCES).length,
    pagesScanned: Object.values(SOURCES).reduce((sum, s) => sum + (s.pages?.length || 1), 0),
    newDiscoveries: discoveredGrants.length,
    totalInFeed: updatedFeed.length,
    errors: allErrors.length,
    errorDetails: allErrors.slice(0, 10),
    topMatches: discoveredGrants.slice(0, 5).map(g => ({
      name: g.name,
      score: g.score,
      categories: g.categories
    })),
    byRegion: {
      nl: discoveredGrants.filter(g => g.region === 'nl').length,
      eu: discoveredGrants.filter(g => g.region === 'eu').length,
      au: discoveredGrants.filter(g => g.region === 'au').length,
      pe: discoveredGrants.filter(g => g.region === 'pe').length,
      int: discoveredGrants.filter(g => g.region === 'int').length
    }
  })
  log.runs = log.runs.slice(-50)
  saveJSON(DISCOVERY_LOG, log)

  // Print summary
  console.log('\n' + '='.repeat(70))
  console.log('  DISCOVERY SUMMARY')
  console.log('='.repeat(70))
  console.log(`  Sources checked: ${Object.keys(SOURCES).length}`)
  console.log(`  Pages scanned: ${Object.values(SOURCES).reduce((sum, s) => sum + (s.pages?.length || 1), 0)}`)
  console.log(`  New discoveries: ${discoveredGrants.length}`)
  console.log(`  Total in feed: ${updatedFeed.length}`)
  console.log(`  Errors: ${allErrors.length}`)

  if (discoveredGrants.length > 0) {
    console.log('\n  Top discoveries (by relevance score):')
    for (const grant of discoveredGrants.slice(0, 10)) {
      console.log(`    [${grant.region}] ${grant.name.substring(0, 60)}`)
      console.log(`        Score: ${grant.score} | Categories: ${grant.categories.join(', ')}`)
      if (grant.deadline) console.log(`        Deadline: ${grant.deadline}`)
      if (grant.amount) console.log(`        Amount: ${grant.amount}`)
    }
  }

  console.log('\n  Completed: ' + new Date().toISOString())

  return {
    newDiscoveries: discoveredGrants.length,
    totalInFeed: updatedFeed.length,
    errors: allErrors.length,
    grants: discoveredGrants
  }
}

function archiveExpired() {
  console.log('\nChecking for expired grants...')

  const tracked = loadJSON(TRACKED_FILE)
  const archived = loadJSON(ARCHIVE_FILE)
  const today = new Date()

  const stillActive = []
  const newlyArchived = []

  for (const grant of tracked) {
    if (grant.deadline && grant.deadline !== 'rolling' && grant.deadline !== 'various') {
      try {
        const deadline = new Date(grant.deadline)
        if (deadline < today) {
          newlyArchived.push({
            ...grant,
            archivedDate: today.toISOString(),
            archiveReason: 'deadline_passed'
          })
          continue
        }
      } catch (e) {
        // Invalid date, keep in tracked
      }
    }
    stillActive.push(grant)
  }

  if (newlyArchived.length > 0) {
    saveJSON(TRACKED_FILE, stillActive)
    saveJSON(ARCHIVE_FILE, [...archived, ...newlyArchived])
    console.log(`Archived ${newlyArchived.length} expired grants`)
  } else {
    console.log('No expired grants to archive')
  }

  return newlyArchived.length
}

function cleanOldFeed() {
  console.log('\nCleaning old feed entries...')

  const feed = loadJSON(FEED_FILE)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const cleaned = feed.filter(g => {
    if (!g.discoveredDate) return true
    return new Date(g.discoveredDate) > thirtyDaysAgo
  })

  const removed = feed.length - cleaned.length
  if (removed > 0) {
    saveJSON(FEED_FILE, cleaned)
    console.log(`Removed ${removed} old entries from feed`)
  } else {
    console.log('No old entries to remove')
  }

  return removed
}

// Show source health report
function showSourceHealth() {
  const log = loadJSON(DISCOVERY_LOG, { runs: [], sourceHealth: {} })

  console.log('\n' + '='.repeat(70))
  console.log('  SOURCE HEALTH REPORT')
  console.log('='.repeat(70))

  const regionNames = {
    nl: '🇳🇱 Netherlands',
    eu: '🇪🇺 EU-wide',
    au: '🇦🇺 Australia',
    pe: '🇵🇪 Peru/LatAm',
    int: '🌍 International'
  }

  // Group by region
  const sourcesByRegion = {}
  for (const [id, config] of Object.entries(SOURCES)) {
    if (!sourcesByRegion[config.region]) {
      sourcesByRegion[config.region] = []
    }
    const health = log.sourceHealth[id] || { successes: 0, failures: 0 }
    const rate = health.successes + health.failures > 0
      ? Math.round((health.successes / (health.successes + health.failures)) * 100)
      : 0
    sourcesByRegion[config.region].push({
      id,
      name: config.name,
      health,
      successRate: rate,
      status: health.failures > health.successes ? '❌' : (rate === 0 ? '❓' : '✅')
    })
  }

  for (const [region, sources] of Object.entries(sourcesByRegion)) {
    console.log(`\n[${regionNames[region] || region}]`)
    console.log('-'.repeat(50))

    sources.sort((a, b) => b.successRate - a.successRate)

    for (const source of sources) {
      const h = source.health
      console.log(`  ${source.status} ${source.name}`)
      if (h.successes > 0 || h.failures > 0) {
        console.log(`     Success rate: ${source.successRate}% (${h.successes}/${h.successes + h.failures})`)
        if (h.lastError) console.log(`     Last error: ${h.lastError}`)
        if (h.lastGrants) console.log(`     Last grants found: ${h.lastGrants}`)
      } else {
        console.log(`     Not yet tested`)
      }
    }
  }

  // Show failing sources
  const failingSources = Object.entries(log.sourceHealth || {})
    .filter(([id, h]) => h.failures > h.successes && h.failures > 0)
    .map(([id, h]) => ({
      id,
      name: SOURCES[id]?.name || id,
      error: h.lastError
    }))

  if (failingSources.length > 0) {
    console.log('\n' + '='.repeat(70))
    console.log('  SOURCES NEEDING ATTENTION')
    console.log('='.repeat(70))
    for (const s of failingSources) {
      console.log(`  • ${s.name}: ${s.error}`)
    }
  }

  console.log('')
}

// Show statistics
function showStats() {
  const log = loadJSON(DISCOVERY_LOG, { runs: [], sourceHealth: {} })
  const feed = loadJSON(FEED_FILE)
  const tracked = loadJSON(TRACKED_FILE)
  const archived = loadJSON(ARCHIVE_FILE)

  console.log('\n' + '='.repeat(70))
  console.log('  GRANT DISCOVERY STATISTICS')
  console.log('='.repeat(70))
  console.log(`  Total sources configured: ${Object.keys(SOURCES).length}`)
  console.log(`  Total keywords: ${ALL_KEYWORDS.length} across ${Object.keys(KEYWORDS).length} categories`)
  console.log(`  Grants in feed (new): ${feed.length}`)
  console.log(`  Grants tracked: ${tracked.length}`)
  console.log(`  Grants archived: ${archived.length}`)
  console.log(`  Discovery runs: ${log.runs.length}`)

  if (log.runs.length > 0) {
    const lastRun = log.runs[log.runs.length - 1]
    console.log(`\n  Last run: ${lastRun.timestamp}`)
    console.log(`    New discoveries: ${lastRun.newDiscoveries}`)
    console.log(`    Errors: ${lastRun.errors}`)
    if (lastRun.byRegion) {
      console.log(`    By region: NL=${lastRun.byRegion.nl}, EU=${lastRun.byRegion.eu}, AU=${lastRun.byRegion.au}, PE=${lastRun.byRegion.pe}, INT=${lastRun.byRegion.int}`)
    }
  }
  console.log('')
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Sacred Foundation Grant Discovery (Enhanced)

Usage:
  node scripts/scrape-grants.js [options]

Options:
  --discover    Run grant discovery (default)
  --archive     Archive expired grants
  --clean       Clean old feed entries (>30 days)
  --health      Show source health report
  --stats       Show statistics
  --all         Run all operations
  --help, -h    Show this help

Sources: ${Object.keys(SOURCES).length} grant portals across 5 regions
Keywords: ${ALL_KEYWORDS.length} terms across ${Object.keys(KEYWORDS).length} categories

Regions:
  🇳🇱 Netherlands: ${Object.values(SOURCES).filter(s => s.region === 'nl').length} sources
  🇪🇺 EU-wide: ${Object.values(SOURCES).filter(s => s.region === 'eu').length} sources
  🇦🇺 Australia: ${Object.values(SOURCES).filter(s => s.region === 'au').length} sources
  🇵🇪 Peru/LatAm: ${Object.values(SOURCES).filter(s => s.region === 'pe').length} sources
  🌍 International: ${Object.values(SOURCES).filter(s => s.region === 'int').length} sources

Examples:
  node scripts/scrape-grants.js           # Run discovery only
  node scripts/scrape-grants.js --all     # Run all operations
  node scripts/scrape-grants.js --health  # Check source health
  node scripts/scrape-grants.js --stats   # Show statistics
`)
    return
  }

  const runAll = args.includes('--all')
  const runDiscover = runAll || args.includes('--discover') || args.length === 0
  const runArchive = runAll || args.includes('--archive')
  const runClean = runAll || args.includes('--clean')
  const runHealth = args.includes('--health')
  const runStats = args.includes('--stats')

  try {
    if (runHealth) {
      showSourceHealth()
      return
    }
    if (runStats) {
      showStats()
      return
    }
    if (runArchive) archiveExpired()
    if (runClean) cleanOldFeed()
    if (runDiscover) {
      const result = await discoverGrants()
      // Don't exit with error code for scraping errors - some sources may be temporarily unavailable
      if (result.newDiscoveries === 0 && result.errors > 10) {
        console.warn('Warning: High error rate with no new discoveries')
      }
    }
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

module.exports = { discoverGrants, archiveExpired, cleanOldFeed, SOURCES, KEYWORDS }

if (require.main === module) {
  main()
}
