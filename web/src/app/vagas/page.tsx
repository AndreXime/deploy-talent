import { Suspense } from 'react'
import { PublicHeader } from '@/components/public-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ExploreJobsClient } from './explore-jobs-client'

function ExploreFallback() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 lg:px-6">
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
