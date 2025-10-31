import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  const widths = ['w-full', 'w-[90%]', 'w-[80%]'];
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-3',
            widths[index % widths.length],
          )}
        />
      ))}
    </div>
  );
}

type AspectRatio = 'square' | 'video' | 'portrait';

interface SkeletonImageProps {
  aspectRatio?: AspectRatio;
  className?: string;
}

const aspectRatioClasses: Record<AspectRatio, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

export function SkeletonImage({
  aspectRatio = 'square',
  className,
}: SkeletonImageProps) {
  return (
    <Skeleton
      className={cn(
        'w-full',
        aspectRatioClasses[aspectRatio],
        className,
      )}
    />
  );
}

type SkeletonCardVariant = 'product' | 'blog' | 'gallery';

interface SkeletonCardProps {
  variant?: SkeletonCardVariant;
  className?: string;
}

export function SkeletonCard({
  variant = 'product',
  className,
}: SkeletonCardProps) {
  if (variant === 'blog') {
    return (
      <div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background',
          className,
        )}
      >
        <SkeletonImage aspectRatio="video" />
        <div className="space-y-3 p-6">
          <Skeleton className="h-6 w-24 rounded-full" />
          <SkeletonText lines={2} />
          <SkeletonText lines={3} />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  if (variant === 'gallery') {
    return (
      <div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background',
          className,
        )}
      >
        <SkeletonImage aspectRatio='video' />
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <SkeletonText lines={2} />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background',
        className,
      )}
    >
      <SkeletonImage aspectRatio="square" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-20" />
        <SkeletonText lines={2} />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}
