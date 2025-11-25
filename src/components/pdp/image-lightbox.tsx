'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Button,
  Icon,
  Modal,
  ModalBody,
  type ModalProps,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ImageLightboxProps
  extends Pick<ModalProps, 'open' | 'onOpenChange'> {
  images: string[];
  productName: string;
  initialIndex?: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export function ImageLightbox({
  images,
  productName,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const t = useTranslations('pdp.gallery');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomLevel(MIN_ZOOM);
    }
  }, [initialIndex, open]);

  const totalImages = images.length;

  const close = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? totalImages - 1 : prev - 1
    );
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === totalImages - 1 ? 0 : prev + 1
    );
  }, [totalImages]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(MAX_ZOOM, prev + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(MIN_ZOOM, prev - 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
  }, []);

  const handleWheelZoom = useCallback(
    (event: WheelEvent) => {
      if (!open) return;
      if (Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      if (event.deltaY > 0) {
        handleZoomOut();
      } else {
        handleZoomIn();
      }
    },
    [handleZoomIn, handleZoomOut, open]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleWheel = (event: WheelEvent) => handleWheelZoom(event);
    const handleKeyDown = (event: KeyboardEvent) => {
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

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [goToNext, goToPrevious, handleWheelZoom, handleZoomIn, handleZoomOut, isRtl, open]);

  const zoomPercentage = useMemo(
    () => Math.round((zoomLevel / MIN_ZOOM) * 100),
    [zoomLevel]
  );

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={t('viewFullscreen')}
      description={productName}
      size="full"
      showCloseButton={false}
      className="lightbox-backdrop border-none bg-transparent p-0 shadow-none"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-6 py-4 text-white">
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
              {t('imageCount', {
                current: currentIndex + 1,
                total: totalImages,
              })}
            </span>
            <span className="text-sm text-white/80">{productName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            onClick={() => close(false)}
            aria-label={t('closeGallery')}
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        <ModalBody className="flex flex-1 flex-col overflow-hidden bg-black/90 p-0 text-white">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <Image
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt={`${productName} - ${t('imageCount', {
                current: currentIndex + 1,
                total: totalImages,
              })}`}
              fill
              sizes="100vw"
              priority
              className="object-contain"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {totalImages > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute start-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={(event: MouseEvent) => {
                    event.stopPropagation();
                    goToPrevious();
                  }}
                  aria-label={t('previousImage')}
                >
                  <Icon name="chevron-left" size="lg" flipRtl />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={(event: MouseEvent) => {
                    event.stopPropagation();
                    goToNext();
                  }}
                  aria-label={t('nextImage')}
                >
                  <Icon name="chevron-right" size="lg" flipRtl />
                </Button>
              </>
            )}

            <div className="absolute bottom-6 end-6 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white backdrop-blur">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={handleZoomOut}
                disabled={zoomLevel <= MIN_ZOOM}
                aria-label={t('zoom')}
              >
                <Icon name="zoom-out" size="sm" />
              </Button>
              <span className="min-w-[3rem] text-center font-medium">
                {zoomPercentage}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={handleZoomIn}
                disabled={zoomLevel >= MAX_ZOOM}
                aria-label={t('zoom')}
              >
                <Icon name="zoom-in" size="sm" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={resetZoom}
                aria-label={t('closeGallery')}
              >
                <Icon name="minimize" size="sm" />
              </Button>
            </div>
          </div>

          {totalImages > 1 && (
            <div className="thumbnail-scroll flex gap-3 overflow-x-auto px-6 py-4">
              {images.map((image, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoomLevel(MIN_ZOOM);
                    }}
                    className={cn(
                      'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-transparent transition-colors',
                      isActive
                        ? 'border-aqua-500 ring-2 ring-aqua-500 ring-offset-1 ring-offset-black'
                        : 'opacity-70 hover:opacity-100'
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
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </ModalBody>
      </div>
    </Modal>
  );
}
