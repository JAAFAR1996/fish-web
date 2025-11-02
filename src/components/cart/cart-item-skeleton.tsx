import { Skeleton, SkeletonImage, SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CartItemSkeletonProps {
  variant?: 'sidebar' | 'full';
  className?: string;
}

export function CartItemSkeleton({
  variant = 'full',
  className,
}: CartItemSkeletonProps) {
  if (variant === 'sidebar') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg border border-border bg-background p-3',
          className,
        )}
      >
        <SkeletonImage aspectRatio="square" className="w-[60px]" />
        <div className="flex flex-1 flex-col gap-2">
          <SkeletonText lines={1} />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-6 rounded-lg border border-border bg-background p-4',
        className,
      )}
    >
      <SkeletonImage aspectRatio="square" className="w-[100px]" />
      <div className="flex flex-1 flex-col gap-3">
        <SkeletonText lines={2} />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}
