import { Skeleton } from '@/components/ui/skeleton';
import { GalleryCardSkeleton } from '@/components/gallery/gallery-card-skeleton';

export default function GalleryLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px,1fr]">
        <Skeleton className="hidden h-[24rem] w-full rounded-lg border border-border bg-muted/40 md:block" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <GalleryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
