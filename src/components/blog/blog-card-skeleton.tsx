import { Card, CardContent } from '@/components/ui';
import { Skeleton, SkeletonImage, SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BlogCardSkeletonProps {
  className?: string;
}

export function BlogCardSkeleton({ className }: BlogCardSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <SkeletonImage aspectRatio="video" />
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-24 rounded-full" />
        <SkeletonText lines={2} />
        <SkeletonText lines={3} />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}
