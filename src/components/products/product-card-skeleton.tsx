import { Card, CardContent, CardFooter } from '@/components/ui';
import { Skeleton, SkeletonImage, SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <SkeletonImage aspectRatio="square" />
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-3 w-20" />
        <SkeletonText lines={2} />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-28" />
      </CardContent>
      <CardFooter className="mt-auto grid gap-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
