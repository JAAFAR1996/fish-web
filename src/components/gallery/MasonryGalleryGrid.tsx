 'use client';

import Masonry from 'react-masonry-css';

import { EmptyGalleryState } from './empty-gallery-state';
import { GalleryCard } from './gallery-card';
import type { GallerySetupWithUser, Locale } from '@/types';
import { cn } from '@/lib/utils';

interface MasonryGalleryGridProps {
  setups: GallerySetupWithUser[];
  locale: Locale;
  className?: string;
}

const BREAKPOINTS = {
  default: 4,
  1280: 3,
  1024: 2,
  640: 1,
};

export function MasonryGalleryGrid({ setups, locale, className }: MasonryGalleryGridProps) {
  if (setups.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyGalleryState />
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className={cn('masonry-grid -ml-6', className)}
      columnClassName="masonry-grid_column pl-6"
    >
      {setups.map((setup, idx) => (
        <GalleryCard
          key={setup.id}
          setup={setup}
          locale={locale}
          priority={idx < 4}
          className="mb-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
        />
      ))}
    </Masonry>
  );
}
