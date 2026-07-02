import { Suspense } from 'react'
import { PublicHeader } from '@/components/public-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ExploreJobsClient } from './explore-jobs-client'

function ExploreFallback() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="page-container flex flex-1 flex-col gap-8 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    </div>
  )
}

export default function ExploreJobsPage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreJobsClient />
    </Suspense>
  )
}
