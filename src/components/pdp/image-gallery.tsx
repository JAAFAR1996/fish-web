'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ImageGalleryProps {
  images: string[];
  productName: string;
  onOpenLightbox: (index: number) => void;
  className?: string;
}

export function ImageGallery({
  images,
  productName,
  onOpenLightbox,
  className,
}: ImageGalleryProps) {
  const t = useTranslations('pdp.gallery');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const totalImages = images.length;

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) =>
      prev === 0 ? totalImages - 1 : prev - 1
    );
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) =>
      prev === totalImages - 1 ? 0 : prev + 1
    );
  }, [totalImages]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (isRtl) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (isRtl) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenLightbox(activeIndex);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => onOpenLightbox(activeIndex)}
        className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted image-zoom-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t('viewFullscreen')}
      >
        <Image
          src={images[activeIndex]}
          alt={`${productName} - ${t('imageCount', {
            current: activeIndex + 1,
            total: totalImages,
          })}`}
          fill
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 600px"
          priority={activeIndex === 0}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {totalImages > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
              onClick={(event) => {
                event.stopPropagation();
                goToPrevious();
              }}
              aria-label={t('previousImage')}
            >
              <Icon name="chevron-left" size="sm" flipRtl />
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
              onClick={(event) => {
                event.stopPropagation();
                goToNext();
              }}
              aria-label={t('nextImage')}
            >
              <Icon name="chevron-right" size="sm" flipRtl />
            </Button>
          </>
        )}

        <div className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-sm">
          <Icon name="zoom-in" size="sm" />
          <span>{t('viewFullscreen')}</span>
        </div>

        <div className="absolute top-3 end-3 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
          {t('imageCount', { current: activeIndex + 1, total: totalImages })}
        </div>
      </div>

      {totalImages > 1 && (
        <div className="thumbnail-scroll flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive
                    ? 'border-aqua-500 ring-2 ring-aqua-500 ring-offset-2'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
                aria-label={t('imageCount', {
                  current: index + 1,
                  total: totalImages,
                })}
              >
                <Image
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
