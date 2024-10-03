import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component
import { Card } from '@/components/ui/card'; // Assuming you have a Card component

export function KnowledgebaseFormSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {/* Rerank Top N Skeleton */}
        <SkeletonSettingCard />

        {/* Rerank Relevance Threshold Skeleton */}
        <SkeletonSettingCard />

        {/* Vector DB Top K Skeleton */}
        <SkeletonSettingCard />
      </div>

      {/* Save Button Skeleton */}
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-10 w-full" /> {/* Button Skeleton */}
      </div>
    </div>
  );
}

function SkeletonSettingCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" /> {/* Icon */}
        <Skeleton className="h-6 w-1/2" /> {/* Title */}
      </div>
      <Skeleton className="h-4 w-3/4" /> {/* Description */}
      <div className="mt-4">
        <Skeleton className="h-6 w-full" /> {/* Slider */}
      </div>
    </Card>
  );
}
