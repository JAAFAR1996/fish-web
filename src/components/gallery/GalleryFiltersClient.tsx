"use client";

import { useState } from 'react';

import type { GalleryFilters as Filters } from '@/types';
import { useRouter } from '@/i18n/navigation';
import { GalleryFilters } from './gallery-filters';

interface GalleryFiltersClientProps {
  initialFilters: Filters;
}

export function GalleryFiltersClient({ initialFilters }: GalleryFiltersClientProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const router = useRouter();

  const apply = () => {
    const params = new URLSearchParams();
    if (filters.tankSizeRange && filters.tankSizeRange !== 'all') params.set('tankSize', filters.tankSizeRange);
    if (filters.styles.length > 0) params.set('style', filters.styles.join(','));
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    router.push(`/gallery?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px,1fr]">
      <GalleryFilters filters={filters} onChange={setFilters} onApply={apply} className="md:sticky md:top-24" />
    </div>
  );
}
