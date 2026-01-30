import { grants, progressStages } from '@/lib/grants-data'
import { notFound } from 'next/navigation'
import GrantPageContent from './GrantPageContent'

// Generate static paths for all grants
export async function generateStaticParams() {
  return grants.map((grant) => ({
    id: grant.id,
  }))
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }) {
  const grant = grants.find(g => g.id === params.id)

  if (!grant) {
    return {
      title: 'Grant Not Found | Sacred Grants Dashboard',
    }
  }

  const description = `${grant.description.slice(0, 150)}...`

  return {
    title: `${grant.name} | Sacred Grants Dashboard`,
    description,
    openGraph: {
      title: grant.name,
      description,
      type: 'article',
      siteName: 'Sacred Grants Dashboard',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: grant.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: grant.name,
      description,
    },
  }
}

export default function GrantPage({ params }) {
  const grant = grants.find(g => g.id === params.id)

  if (!grant) {
    notFound()
  }

  return <GrantPageContent grant={grant} />
}
