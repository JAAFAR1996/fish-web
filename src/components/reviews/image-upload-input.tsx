'use client';

import {
  DragEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_REVIEW_IMAGES,
} from '@/lib/reviews/constants';
import { cn } from '@/lib/utils';
import type { ImageUploadPreview } from '@/types';

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to generate preview'));
    reader.readAsDataURL(file);
  });

export interface ImageUploadInputProps {
  images: ImageUploadPreview[];
  onChange: (images: ImageUploadPreview[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUploadInput({
  images,
  onChange,
  maxImages = MAX_REVIEW_IMAGES,
  disabled = false,
  className,
}: ImageUploadInputProps) {
  const t = useTranslations('reviews');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const remainingSlots = useMemo(
    () => Math.max(maxImages - images.length, 0),
    [images.length, maxImages],
  );

  const showDropzone = remainingSlots > 0;

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;

      setError(null);

      const selectedFiles = Array.from(files);

      if (!selectedFiles.length) {
        return;
      }

      if (selectedFiles.length > remainingSlots) {
        setError(t('validation.imagesMax'));
      }

      const allowedFiles = selectedFiles.slice(0, remainingSlots);
      const previews: ImageUploadPreview[] = [];

      for (const file of allowedFiles) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setError(t('validation.imageTypeInvalid'));
          continue;
        }

        if (file.size > MAX_IMAGE_SIZE) {
          setError(t('validation.imageSizeMax'));
          continue;
        }

        try {
          const preview = await toDataUrl(file);
          previews.push({
            file,
            preview,
            uploading: false,
            uploaded: false,
            url: null,
            error: null,
          });
        } catch {
          setError(t('errors.uploadFailed'));
        }
      }

      if (previews.length) {
        onChange([...images, ...previews]);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [disabled, images, onChange, remainingSlots, t],
  );

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      await addImages(event.target.files);
    },
    [addImages],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      await addImages(event.dataTransfer.files);
    },
    [addImages, disabled],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemoveImage = (index: number) => {
    const nextImages = images.filter((_, idx) => idx !== index);
    onChange(nextImages);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {showDropzone && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition',
            isDragging && 'border-aqua-400 bg-aqua-50 dark:border-aqua-600 dark:bg-aqua-900/10',
            disabled && 'opacity-60',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-disabled={disabled}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <Icon name="upload" className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{t('form.dragDrop')}</p>
            <p className="text-xs">{t('form.imagesHint')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Icon name="upload" className="h-4 w-4" />
            {t('form.uploadImages')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            multiple
            hidden
            onChange={handleFileInputChange}
            disabled={disabled}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => {
            const source = image.preview || image.url || '';

            return (
              <div
                key={`${source}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                {source ? (
                  <Image
                    src={source}
                    alt={t('form.images')}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105 review-image-hover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10">
                    <Icon name="image" className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition hover:bg-background hover:text-foreground"
                  onClick={() => handleRemoveImage(index)}
                  aria-label={t('form.cancel')}
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>

                {image.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Icon name="loader" className="h-6 w-6 motion-safe:animate-spin" />
                  </div>
                )}

                {image.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-coral-500/80 p-2 text-center text-xs text-white">
                    <Icon name="alert" className="h-4 w-4" />
                    <span>{image.error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length} / {maxImages}{' '}
        {t('form.images')}
      </p>

      {error && (
        <p className="text-sm text-coral-600 dark:text-coral-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
