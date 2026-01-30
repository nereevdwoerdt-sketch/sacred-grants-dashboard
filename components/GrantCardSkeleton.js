'use client'

export default function GrantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#312117]/20 animate-pulse">
      <div className="p-5">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-earth-200 rounded skeleton" />
              <div className="w-16 h-5 bg-earth-200 rounded skeleton" />
            </div>
            <div className="w-3/4 h-6 bg-earth-200 rounded skeleton mb-1" />
            <div className="w-1/2 h-6 bg-earth-200 rounded skeleton" />
          </div>
          <div className="w-5 h-5 bg-earth-200 rounded skeleton" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="w-full h-4 bg-earth-200 rounded skeleton" />
          <div className="w-4/5 h-4 bg-earth-200 rounded skeleton" />
        </div>

        {/* Quick info skeleton */}
        <div className="flex gap-4 mb-4">
          <div className="w-20 h-5 bg-earth-200 rounded skeleton" />
          <div className="w-24 h-5 bg-earth-200 rounded skeleton" />
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="w-14 h-5 bg-earth-200 rounded skeleton" />
          <div className="w-16 h-5 bg-earth-200 rounded skeleton" />
          <div className="w-12 h-5 bg-earth-200 rounded skeleton" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="px-5 py-3 bg-[#F5F3E6] border-t border-[#312117]/10 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-earth-200 rounded skeleton" />
          <div className="w-16 h-4 bg-earth-200 rounded skeleton" />
        </div>
      </div>
    </div>
  )
}

export function GrantGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <GrantCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-earth-200 animate-pulse">
      <div className="w-24 h-4 bg-earth-200 rounded skeleton mb-2" />
      <div className="w-16 h-8 bg-earth-200 rounded skeleton" />
    </div>
  )
}

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}
