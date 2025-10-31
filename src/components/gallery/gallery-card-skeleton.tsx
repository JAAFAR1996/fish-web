import { Card, CardContent } from '@/components/ui';
import { Skeleton, SkeletonImage, SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface GalleryCardSkeletonProps {
  className?: string;
}

export function GalleryCardSkeleton({ className }: GalleryCardSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <SkeletonImage aspectRatio="video" />
      <CardContent className="space-y-4 p-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <SkeletonText lines={2} />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}
