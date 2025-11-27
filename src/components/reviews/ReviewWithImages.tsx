'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { ImageLightbox } from '@/components/pdp/image-lightbox';
import type { ReviewWithUser } from '@/types';
import { cn } from '@/lib/utils';

type ReviewWithImagesProps = {
  reviews: ReviewWithUser[];
  className?: string;
};

export function ReviewWithImages({ reviews, className }: ReviewWithImagesProps) {
  const t = useTranslations('reviews');
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number; images: string[] }>({
    open: false,
    index: 0,
    images: [],
  });

  const filtered = useMemo(
    () => reviews.filter((review) => Array.isArray(review.images) && review.images.length),
    [reviews],
  );

  if (!filtered.length) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon name="image" className="h-4 w-4 text-aqua-600" />
        <span>{t('filters.withImages')}</span>
      </div>
      {filtered.map((review) => (
        <Card key={review.id} className="space-y-3 border bg-background/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{review.user?.full_name ?? t('yourReview')}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
            {(
              (review as unknown as { verified?: boolean }).verified ||
              (review as unknown as { verified_purchase?: boolean }).verified_purchase
            ) && (
              <Badge variant="success" className="flex items-center gap-1 text-[12px]">
                <Icon name="shield-check" size="xs" />
                {t('trustedCustomer')}
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {review.images.slice(0, 5).map((image, idx) => {
              const showMoreBadge = idx === 4 && review.images.length > 5;
              return (
                <button
                  key={image}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  onClick={() =>
                    setLightbox({
                      open: true,
                      index: idx,
                      images: review.images,
                    })
                  }
                >
                  <Image
                    src={image}
                    alt={`${review.user?.full_name ?? 'review'} image ${idx + 1}`}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                    <Icon name="zoom-in" className="h-5 w-5 text-white" />
                  </div>
                  {showMoreBadge && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                      +{review.images.length - 4}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          productName={lightbox.images[lightbox.index] ?? 'review image'}
          open={lightbox.open}
          onOpenChange={(next) =>
            setLightbox((prev) => ({ ...prev, open: next }))
          }
        />
      )}
    </div>
  );
}
