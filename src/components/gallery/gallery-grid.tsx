import { EmptyGalleryState } from './empty-gallery-state';
import { GalleryCard } from './gallery-card';
import type { GallerySetupWithUser, Locale } from '@/types';
import { cn } from '@/lib/utils';

interface GalleryGridProps {
  setups: GallerySetupWithUser[];
  locale: Locale;
  className?: string;
}

export function GalleryGrid({ setups, locale, className }: GalleryGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 @md:grid-cols-2 @lg:grid-cols-3', className)}>
      {setups.length === 0 && (
        <div className="col-span-full">
          <EmptyGalleryState />
        </div>
      )}
      {setups.map((setup, idx) => (
        <GalleryCard key={setup.id} setup={setup} locale={locale} priority={idx < 3} />
      ))}
    </div>
  );
}
