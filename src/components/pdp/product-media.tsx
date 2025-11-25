'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { ProductMedia as ProductMediaItem } from '@/types';
import { Icon } from '@/components/ui';
import { ImageGallery } from './image-gallery';
import { ImageLightbox } from './image-lightbox';

export interface ProductMediaProps {
  images: string[];
  productName: string;
  className?: string;
  media?: ProductMediaItem[];
}

const MAX_MEDIA_ITEMS = 8;

function normalizeMediaFromImages(images: string[], productName: string): ProductMediaItem[] {
  return images.map((url, index) => {
    const lower = url.toLowerCase();
    const isVideo =
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.includes('youtube.com/') ||
      lower.includes('youtu.be/');

    if (isVideo) {
      return {
        type: 'video' as const,
        url,
        alt: `${productName} video`,
      };
    }

    return {
      type: 'image' as const,
      url,
      alt: `${productName} image ${index + 1}`,
    };
  });
}

function toEmbedUrl(url: string): string | null {
  if (url.includes('youtube.com/watch')) {
    const params = new URL(url).searchParams;
    const id = params.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  return null;
}

export function ProductMedia({
  images,
  productName,
  media,
  className,
}: ProductMediaProps) {
  const resolvedMedia = useMemo<ProductMediaItem[]>(() => {
    const base = media && media.length > 0
      ? media
      : normalizeMediaFromImages(images, productName);

    return base.slice(0, MAX_MEDIA_ITEMS);
  }, [images, media, productName]);

  const hasVideo = resolvedMedia.some((item) => item.type === 'video');
  const imageItems = useMemo(
    () => resolvedMedia.filter((item) => item.type === 'image'),
    [resolvedMedia]
  );

  const videoItems = useMemo(
    () => resolvedMedia.filter((item) => item.type === 'video'),
    [resolvedMedia]
  );

  const imageUrls = useMemo(
    () => imageItems.map((item) => item.url),
    [imageItems]
  );

  const imageIndexLookup = useMemo(() => {
    let counter = -1;
    return resolvedMedia.map((item) => {
      if (item.type === 'image') {
        counter += 1;
        return counter;
      }
      return -1;
    });
  }, [resolvedMedia]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleOpenLightbox = (index: number) => {
    const imageIndex = imageIndexLookup[index];
    if (imageIndex >= 0) {
      setLightboxIndex(imageIndex);
      setLightboxOpen(true);
    }
  };

  if (!hasVideo) {
    return (
      <div className={className}>
        <ImageGallery
          images={imageUrls}
          productName={productName}
          onOpenLightbox={(index) => {
            setLightboxIndex(index);
            setLightboxOpen(true);
          }}
        />
        <ImageLightbox
          images={imageUrls}
          productName={productName}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      </div>
    );
  }

  const activeMedia = resolvedMedia[activeIndex] ?? resolvedMedia[0];

  return (
    <div className={className}>
      <div className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {activeMedia.type === 'image' ? (
          <button
            type="button"
            className="flex h-full w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => handleOpenLightbox(activeIndex)}
            aria-label={productName}
          >
            <Image
              src={activeMedia.url}
              alt={activeMedia.alt ?? productName}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 600px"
              priority={activeIndex === 0}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ) : (
          (() => {
            const embedUrl = toEmbedUrl(activeMedia.url);
            if (embedUrl) {
              return (
                <iframe
                  src={embedUrl}
                  title={activeMedia.alt ?? productName}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            }

            return (
              <video
                controls
                poster={activeMedia.thumbnail ?? undefined}
                className="h-full w-full object-contain"
              >
                <source src={activeMedia.url} />
              </video>
            );
          })()
        )}
      </div>

      <div className="thumbnail-scroll mt-4 flex gap-2 overflow-x-auto pb-1">
        {resolvedMedia.map((item, index) => {
          const isActive = index === activeIndex;
          const isImage = item.type === 'image';
          const key = `${item.type}-${item.url}-${index}`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isActive
                  ? 'border-aqua-500 ring-2 ring-aqua-500 ring-offset-2'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
              aria-label={item.alt ?? `${productName} media ${index + 1}`}
            >
              {isImage ? (
                <Image
                  src={item.url}
                  alt={item.alt ?? productName}
                  fill
                  sizes="80px"
                  className="object-cover"
                  loading="lazy"
                />
              ) : (
                <>
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.alt ?? productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/70 text-white">
                      {productName}
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <Icon name="play" size="sm" />
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          productName={productName}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
}
