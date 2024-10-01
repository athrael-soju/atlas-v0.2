import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card'; // Assuming you have a Card component

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* First Name Skeleton */}
        <div>
          <Skeleton className="mb-2 h-4 w-32" /> {/* Label */}
          <Skeleton className="h-8 w-full" /> {/* Input */}
        </div>

        {/* Last Name Skeleton */}
        <div>
          <Skeleton className="mb-2 h-4 w-32" /> {/* Label */}
          <Skeleton className="h-8 w-full" /> {/* Input */}
        </div>

        {/* Email Skeleton */}
        <div>
          <Skeleton className="mb-2 h-4 w-32" /> {/* Label */}
          <Skeleton className="h-8 w-full" /> {/* Input */}
        </div>

        {/* Date of Birth Skeleton */}
        <div>
          <Skeleton className="mb-2 h-4 w-32" /> {/* Label */}
          <Skeleton className="h-8 w-full" /> {/* Date Picker */}
        </div>

        {/* Country of Origin Skeleton */}
        <SkeletonSettingCard />

        {/* Gender Skeleton */}
        <SkeletonSettingCard />

        {/* Preferred Language Skeleton */}
        <SkeletonSettingCard />

        {/* Occupation Skeleton */}
        <SkeletonSettingCard />

        {/* Technical Aptitude Skeleton */}
        <SkeletonSettingCard />

        {/* Military Status Skeleton */}
        <SkeletonSettingCard />
      </div>

      {/* Personalized Responses Section Skeleton */}
      <Card className="grid gap-4">
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-6 w-6 rounded-full" /> {/* Icon */}
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" /> {/* Title */}
          </div>
          <Skeleton className="h-5 w-10" /> {/* Switch */}
        </div>
      </Card>

      {/* Save Button Skeleton */}
      <div className="mt-4 flex justify-center">
        <Skeleton className="h-9 w-full" /> {/* Button */}
      </div>
    </div>
  );
}

function SkeletonSettingCard() {
  return (
    <Card className="space-y-1 p-4">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6 rounded-full" /> {/* Icon */}
        <Skeleton className="h-4 w-40" /> {/* Title */}
      </div>
      <Skeleton className="mt-1 h-8 w-full" /> {/* Select */}
    </Card>
  );
}
