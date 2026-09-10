export const themes = [
  {
    id: 'muzikanten',
    name: 'Muzikanten — Optreden, Productie & Projecten',
    nameEn: 'Musicians — Performing, Production & Projects',
    emoji: '🎸',
    description: 'Grants for musicians: live performance, album production, touring, new projects, financial kickstart, instruments, and export.',
    descriptionNl: 'Subsidies voor muzikanten: optredens, albumproductie, touring, nieuwe projecten, financieel zetje, instrumenten en export.',
    color: 'purple',
    filter: (g) => {
      const n = (g.name + ' ' + g.description + ' ' + g.tags.join(' ')).toLowerCase()
      return (
        g.tags.some(t => ['music', 'musician', 'performing-arts', 'festival', 'talent', 'concert'].includes(t)) ||
        g.grantCategory === 'performing-arts' ||
        n.match(/muziek|music|album|productie|concert|tour|podium|componist|compositie|muzikant|instrument|optre/)
      )
    },
  },
  {
    id: 'touring',
    name: 'Touring & Export — Europa & Internationaal',
    nameEn: 'Touring & Export — Europe & International',
    emoji: '✈️',
    description: 'Touring support, travel grants, showcase festivals, international co-productions, venue networks, and export funding for musicians performing across Europe and beyond.',
    descriptionNl: 'Toursubsidies, reiskosten, showcasefestivals, internationale coproducties, venue-netwerken en exportfunding voor muzikanten die door Europa en daarbuiten touren.',
    color: 'sky',
    filter: (g) => {
      const n = (g.name + ' ' + g.description + ' ' + g.tags.join(' ')).toLowerCase()
      const isMusicOrArts = g.tags.some(t => ['music', 'musician', 'performing-arts', 'concert', 'festival', 'dance', 'theater'].includes(t)) ||
        g.grantCategory === 'performing-arts' || g.grantCategory === 'arts' ||
        n.match(/muziek|music|concert|podium|performing|artiest|artist/)
      const isTouringRelated = g.tags.some(t => ['touring', 'showcase', 'co-production', 'mobility', 'venue'].includes(t)) ||
        n.match(/tour(?:ing|support)|snelloket|buitenland|werkreis|showcase|music.*export|mobil|co-?produc.*international|liveurope|perform.*europe|culture.*moves|reissubsidie|etep|keychange|muziek.*export|international.*optre|jump.*music|iberm[uú]sica/)
      return isMusicOrArts && isTouringRelated
    },
  },
  {
    id: 'artists',
    name: 'Voor Artiesten & Makers',
    nameEn: 'For Artists & Makers',
    emoji: '🎵',
    description: 'Talent development, music production, residencies, performing arts — grants individual artists and creators can apply for.',
    descriptionNl: 'Talentontwikkeling, muziekproductie, residencies, podiumkunsten — subsidies voor individuele artiesten en makers.',
    color: 'purple',
    filter: (g) =>
      g.grantCategory === 'arts' ||
      g.grantCategory === 'performing-arts' ||
      g.category === 'individual' ||
      g.tags.some(t => ['residency', 'individual', 'artist', 'music', 'performing-arts', 'creative', 'talent'].includes(t)),
  },
  {
    id: 'cacao',
    name: 'Cacao & Supply Chain',
    nameEn: 'Cacao & Supply Chain',
    emoji: '🫘',
    description: 'Sustainable cacao, fair trade, food innovation, export grants, and supply chain transparency.',
    descriptionNl: 'Duurzame cacao, eerlijke handel, voedselinnovatie, exportsubsidies en ketentransparantie.',
    color: 'amber',
    filter: (g) =>
      g.grantCategory === 'food' ||
      g.grantCategory === 'export' ||
      g.tags.some(t => ['cacao', 'food', 'supply-chain', 'fair-trade', 'export', 'agriculture', 'cooperative', 'sustainable'].includes(t)),
  },
  {
    id: 'indigenous',
    name: 'Asháninka & Indigenous Rights',
    nameEn: 'Asháninka & Indigenous Rights',
    emoji: '🌿',
    description: 'Indigenous community support, land rights, territorial defense, cultural preservation, and traditional knowledge.',
    descriptionNl: 'Ondersteuning inheemse gemeenschappen, landrechten, cultureel behoud en traditionele kennis.',
    color: 'green',
    filter: (g) =>
      g.grantCategory === 'indigenous' ||
      g.tags.some(t => ['indigenous', 'aboriginal', 'territorial', 'peru', 'amazon', 'community', 'grassroots'].includes(t)),
  },
  {
    id: 'documentary',
    name: 'Film & Documentaire',
    nameEn: 'Film & Documentary',
    emoji: '🎬',
    description: 'Documentary production, film funds, cross-media projects, and storytelling grants.',
    descriptionNl: 'Documentaireproductie, filmfondsen, crossmediale projecten en verhalenvertelling.',
    color: 'red',
    filter: (g) =>
      g.grantCategory === 'documentary' ||
      g.tags.some(t => ['documentary', 'film', 'storytelling', 'film-festival', 'cross-media'].includes(t)),
  },
  {
    id: 'wellbeing',
    name: 'Welzijn & Sociale Verbinding',
    nameEn: 'Wellbeing & Social Connection',
    emoji: '💛',
    description: 'Mental health, loneliness, alcohol-free programming, youth wellbeing, and social connection.',
    descriptionNl: 'Mentale gezondheid, eenzaamheid, alcoholvrij programmeren, jongerenwelzijn en sociale verbinding.',
    color: 'yellow',
    filter: (g) =>
      g.grantCategory === 'health' ||
      g.tags.some(t => ['mental-health', 'loneliness', 'wellbeing', 'community', 'connection', 'social-cohesion', 'prevention'].includes(t)),
  },
  {
    id: 'environment',
    name: 'Natuur & Klimaat',
    nameEn: 'Nature & Climate',
    emoji: '🌍',
    description: 'Rainforest protection, biodiversity, climate action, agroforestry, and conservation grants.',
    descriptionNl: 'Regenwoudbescherming, biodiversiteit, klimaatactie, agroforestry en natuurbehoud.',
    color: 'emerald',
    filter: (g) =>
      g.grantCategory === 'environmental' ||
      g.tags.some(t => ['environment', 'climate', 'biodiversity', 'conservation', 'amazon', 'nature'].includes(t)),
  },
  {
    id: 'culture',
    name: 'Cultuur & Erfgoed',
    nameEn: 'Culture & Heritage',
    emoji: '🏛️',
    description: 'Cultural exchange, intangible heritage, ceremonies, international cooperation, and heritage preservation.',
    descriptionNl: 'Culturele uitwisseling, immaterieel erfgoed, ceremonies, internationale samenwerking en erfgoedbehoud.',
    color: 'indigo',
    filter: (g) =>
      g.grantCategory === 'cultural' ||
      g.tags.some(t => ['heritage', 'cultural', 'intangible', 'cultural-democracy', 'co-creation'].includes(t)),
  },
  {
    id: 'social-enterprise',
    name: 'Social Enterprise & Impact',
    nameEn: 'Social Enterprise & Impact',
    emoji: '🚀',
    description: 'Social entrepreneurship, impact investment, growth funding, and business acceleration.',
    descriptionNl: 'Sociaal ondernemerschap, impactinvestering, groeikapitaal en bedrijfsversnelling.',
    color: 'blue',
    filter: (g) =>
      g.grantCategory === 'social-enterprise' ||
      g.tags.some(t => ['social-enterprise', 'impact', 'investment', 'accelerator', 'scale-up', 'pioneer'].includes(t)),
  },
]

export function getTheme(id) {
  return themes.find(t => t.id === id)
}

export function getThemeGrants(themeId, grants) {
  const theme = getTheme(themeId)
  if (!theme) return []
  return grants.filter(theme.filter)
}
