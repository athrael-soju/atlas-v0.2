import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Assuming you have a Card component
import { Tabs, TabsList } from '@/components/ui/tabs';

export function ForgeFormSkeleton() {
  return (
    <div className="container mx-auto space-y-8 py-10">
      <Tabs defaultValue="processing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {/* Tab Skeletons */}
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </TabsList>

        {/* Skeleton for content */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Render 6 Skeleton Cards to match the settings */}
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />{' '}
                  {/* Icon height increased */}
                  <Skeleton className="h-5 w-1/2" />{' '}
                  {/* Title height increased */}
                </div>
                <Skeleton className="mt-2 h-4 w-3/4" /> {/* Description */}
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />{' '}
                {/* Select/Slider height increased */}
                <Skeleton className="mt-2 h-5 w-1/3" />{' '}
                {/* Additional info height increased */}
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>

      {/* Skeleton for Save Button */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-full" />{' '}
        {/* Save button height increased */}
      </div>
    </div>
  );
}
