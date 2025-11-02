"use client";

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Icon } from '@/components/ui';
import type { GalleryMedia, GallerySetupWithProducts, Locale, Product } from '@/types';
import { STYLE_COLORS } from '@/lib/gallery/constants';
import { HotspotMarker } from './hotspot-marker';
import { HotspotPopover } from './hotspot-popover';
import { ShopThisSetupButton } from './shop-this-setup-button';
import { sortHotspotsByPosition } from '@/lib/gallery/hotspot-utils';
import { cn } from '@/lib/utils';

interface GalleryDetailViewProps {
  setup: GallerySetupWithProducts;
  locale: Locale;
  className?: string;
}

export function GalleryDetailView({ setup, locale, className }: GalleryDetailViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [popover, setPopover] = useState<{ product: Product; anchor: HTMLElement } | null>(null);
  const tSetup = useTranslations('gallery.setup');
  const tStyles = useTranslations('gallery.styles');

  const styleColor = STYLE_COLORS[setup.style] ?? 'bg-muted text-foreground';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const tankSizeLabel = tSetup('tankSizeValue', { size: numberFormatter.format(setup.tank_size) });

  const mediaItems = useMemo<GalleryMedia[]>(() => {
    return (setup.media_urls ?? []).map((item, idx) => {
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        const isVideo = lower.endsWith('.mp4') || lower.includes('/video/');
        return {
          type: (isVideo ? 'video' : 'image') as 'video' | 'image',
          url: item,
          order: idx,
        } satisfies GalleryMedia;
      }
      const order = typeof item.order === 'number' ? item.order : idx;
      const type: 'video' | 'image' = item.type === 'video' ? 'video' : 'image';
      return {
        type,
        url: item.url,
        thumbnail: item.thumbnail,
        order,
      };
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [setup.media_urls]);

  const activeMedia = mediaItems[activeIndex] ?? mediaItems[0] ?? {
    type: 'image',
    url: '/images/placeholder.png',
    order: 0,
  };
  const showHotspots = activeMedia.type === 'image';

  const productsMap = useMemo(() => new Map(setup.products.map((p) => [p.id, p])), [setup.products]);
  const hotspots = useMemo(() => sortHotspotsByPosition(setup.hotspots ?? []), [setup.hotspots]);

  useEffect(() => {
    if (!showHotspots && popover) {
      setPopover(null);
    }
  }, [showHotspots, popover]);

  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)}>
      {/* Left: Image with hotspots */}
      <div>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          {activeMedia.type === 'video' ? (
            <video
              key={activeMedia.url}
              controls
              playsInline
              poster={activeMedia.thumbnail}
              className="h-full w-full object-cover"
              aria-label={setup.title}
            >
              <source src={activeMedia.url} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={activeMedia.url}
              alt={setup.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}

          {showHotspots &&
            hotspots.map((h, idx) => {
              const product = h.product_id ? productsMap.get(h.product_id) : undefined;
              if (!product) return null;
              return (
                <HotspotMarker
                  key={h.id}
                  hotspot={h}
                  index={idx}
                  productName={product.name}
                  onClick={(e) => setPopover({ product, anchor: e.currentTarget })}
                />
              );
            })}
        </div>

        {/* Thumbnails */}
        {mediaItems.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {mediaItems.map((item, idx) => (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn('relative h-16 w-24 overflow-hidden rounded border', idx === activeIndex ? 'border-aqua-500' : 'border-border')}
              >
                {item.type === 'video' ? (
                  <>
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={`Media ${idx + 1}`} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/60 text-white">
                        <Icon name="play" className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Icon name="play" className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <Image src={item.url} alt={`Media ${idx + 1}`} fill sizes="96px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={styleColor}>{tStyles(setup.style)}</Badge>
          <span className="text-sm text-muted-foreground">{tankSizeLabel}</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{setup.title}</h1>
        {setup.description && <p className="text-sm text-muted-foreground">{setup.description}</p>}

        <ShopThisSetupButton setup={setup} />

        {/* Products */}
        {setup.products.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{tSetup('productsHeading')}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {setup.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="line-clamp-1">{p.name}</span>
                  <span>{p.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {popover && (
        <HotspotPopover
          product={popover.product}
          isOpen={true}
          onClose={() => setPopover(null)}
          anchorEl={popover.anchor}
          locale={locale}
        />
      )}
    </div>
  );
}
