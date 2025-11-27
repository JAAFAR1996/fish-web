'use client';

import { useMemo, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/types';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import type { Product } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

type ProductComparisonProps = {
  products: Product[];
};

const HEADERS = ['images', 'price', 'difficulty', 'tank', 'lighting', 'temperature'] as const;

export function ProductComparison({ products }: ProductComparisonProps) {
  const t = useTranslations('product');
  const locale = useLocale() as unknown as Locale;
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    products.slice(0, 2).map((p) => p.id),
  );

  const normalized = useMemo(
    () =>
      selectedIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean)
        .slice(0, 4)
        .map((product) => ({
          ...product!,
          priceFormatted: formatCurrency(product!.price, locale),
          tankRange: product!.specifications.compatibility.displayText,
        })),
    [locale, products, selectedIds],
  );

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((pid) => pid !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const headerLabel = (header: (typeof HEADERS)[number]) => {
    switch (header) {
      case 'images':
        return t('quickView.specifications');
      case 'price':
        return t('price.discountedPrice');
      case 'difficulty':
        return 'Difficulty';
      case 'tank':
        return t('specs.compatibility');
      case 'lighting':
        return 'Lighting';
      case 'temperature':
        return 'Temperature';
      default:
        return '';
    }
  };

  if (!products.length) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background/60 p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">
          Select 2–4 products to compare
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 8).map((product) => {
            const checked = selectedIds.includes(product.id);
            const disabled = !checked && selectedIds.length >= 4;
            return (
              <label
                key={product.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/40 p-3 transition',
                  checked && 'border-aqua-500 bg-aqua-50',
                  disabled && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.brand}</span>
                </div>
              </label>
            );
          })}
        </div>
        {selectedIds.length < 2 && (
          <p className="mt-2 text-xs text-destructive">Choose at least two products.</p>
        )}
      </div>

      {normalized.length >= 2 && (
        <div className="relative overflow-x-auto rounded-xl border bg-background/80 shadow-lg">
          <div className="sticky top-0 z-10 grid min-w-[720px] grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-2 border-b bg-background/90 p-3 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('quickView.specifications')}
            </div>
            {normalized.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={product.thumbnail || product.images?.[0] || '/images/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.brand}</span>
                </div>
              </div>
            ))}
          </div>

          {HEADERS.map((header) => (
            <div
              key={header}
              className="grid min-w-[720px] grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-2 border-b px-3 py-4 last:border-b-0"
            >
              <div className="text-sm font-medium capitalize text-muted-foreground">
                {headerLabel(header)}
              </div>

              {normalized.map((product) => (
                <Card
                  key={`${header}-${product.id}`}
                  className={cn('h-full border-none bg-muted/50 shadow-sm')}
                >
                  <div className="p-3">
                    {header === 'images' && product.images?.length > 1 ? (
                      <ReactCompareSlider
                        boundsPadding={0}
                        style={{ height: 180, borderRadius: 12, overflow: 'hidden' }}
                        itemOne={
                          <ReactCompareSliderImage src={product.images[0]} alt={product.name} />
                        }
                        itemTwo={
                          <ReactCompareSliderImage
                            src={product.images[1]}
                            alt={`${product.name} alt view`}
                          />
                        }
                      />
                    ) : header === 'images' ? (
                      <div className="flex h-[180px] items-center justify-center rounded-lg bg-muted">
                        <span className="text-xs text-muted-foreground">
                          {t('a11y.productImage', { productName: product.name })}
                        </span>
                      </div>
                    ) : null}

                    {header === 'price' && (
                      <div className="text-lg font-semibold text-foreground">
                        {product.priceFormatted}
                      </div>
                    )}

                    {header === 'difficulty' && product.difficulty && (
                      <DifficultyBadge level={product.difficulty} />
                    )}

                    {header === 'tank' && (
                      <div className="text-sm text-foreground">{product.tankRange}</div>
                    )}

                    {header === 'lighting' && (
                      <Badge variant="secondary" className="mt-1">
                        {product.specifications.power
                          ? `${product.specifications.power}W`
                          : 'Medium'}
                      </Badge>
                    )}

                    {header === 'temperature' && (
                      <div className="text-sm text-muted-foreground">24° - 28° C</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
