"use client";

import { useTranslations } from 'next-intl';

import { Button, Checkbox, Input } from '@/components/ui';
import type { GalleryFilters, GalleryStyle } from '@/types';
import { GALLERY_STYLES } from '@/lib/gallery/constants';

interface GalleryFiltersProps {
  filters: GalleryFilters;
  onChange: (filters: GalleryFilters) => void;
  onApply?: () => void;
  className?: string;
}

export function GalleryFilters({ filters, onChange, onApply, className }: GalleryFiltersProps) {
  const t = useTranslations('gallery.filters');

  const handleToggleStyle = (style: GalleryStyle) => {
    const exists = filters.styles.includes(style);
    const styles = exists
      ? filters.styles.filter((s) => s !== style)
      : [...filters.styles, style];
    onChange({ ...filters, styles });
  };

  return (
    <div className={className}>
      <div className="sticky top-24 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t('sort')}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ tankSizeRange: 'all', styles: [], searchQuery: '', sortBy: 'newest' })}>
            Reset
          </Button>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('tankSize')}</label>
          <div className="flex flex-wrap gap-2">
            {(['all','nano','small','medium','large'] as const).map((range) => (
              <Button
                key={range}
                type="button"
                size="sm"
                variant={filters.tankSizeRange === range ? 'primary' : 'outline'}
                onClick={() => onChange({ ...filters, tankSizeRange: range })}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('style')}</label>
          <div className="grid grid-cols-2 gap-2">
            {GALLERY_STYLES.map((style) => (
              <label key={style} className="flex items-center gap-2 text-sm">
                <Checkbox checked={filters.styles.includes(style)} onCheckedChange={() => handleToggleStyle(style)} />
                <span>{style}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('search')}</label>
          <Input value={filters.searchQuery} onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })} />
        </div>

        <Button type="button" variant="primary" className="w-full" onClick={onApply}>
          {t('applyFilters')}
        </Button>
      </div>
    </div>
  );
}
