import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function GrantNotFound() {
  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-earth-900 mb-4">
          Grant Not Found
        </h1>
        <p className="text-earth-600 mb-8">
          The grant you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/dashboard/grants"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sacred-600 text-white rounded-lg hover:bg-sacred-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Grants
        </Link>
      </div>
    </div>
  )
}
