'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Icon,
  Input,
  StarRating,
} from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import {
  createReviewAction,
  updateReviewAction,
} from '@/lib/reviews/review-actions';
import {
  uploadReviewImages,
} from '@/lib/reviews/image-upload';
import {
  validateReviewForm,
} from '@/lib/reviews/review-validation';
import { cn } from '@/lib/utils';
import type {
  ImageUploadPreview,
  Review,
} from '@/types';

import { ImageUploadInput } from './image-upload-input';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ReviewFormProps {
  productId: string;
  existingReview: Review | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  revalidatePath?: string;
  className?: string;
}

const removeReviewsPrefix = (key: string): string =>
  key.startsWith('reviews.') ? key.replace('reviews.', '') : key;

const createInitialImages = (review: Review | null): ImageUploadPreview[] =>
  review?.images?.map((url) => ({
    file: null,
    preview: url,
    uploading: false,
    uploaded: true,
    url,
    error: null,
  })) ?? [];

export function ReviewForm({
  productId,
  existingReview,
  onSuccess,
  onCancel,
  revalidatePath,
  className,
}: ReviewFormProps) {
  const t = useTranslations('reviews');
  const translateKey = useMemo(
    () => (key: string) => {
      const normalized = removeReviewsPrefix(key);
      try {
        return t(normalized);
      } catch {
        return normalized;
      }
    },
    [t],
  );
  const { user } = useAuth();

  const initialImages = useMemo(() => createInitialImages(existingReview), [existingReview]);

  const [rating, setRating] = useState<number | null>(
    existingReview?.rating ?? null,
  );
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [images, setImages] = useState<ImageUploadPreview[]>(initialImages);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    setRating(existingReview?.rating ?? null);
    setTitle(existingReview?.title ?? '');
    setComment(existingReview?.comment ?? '');
    setImages(createInitialImages(existingReview));
    setErrors({});
    setMessage(null);
    setStatus('idle');
  }, [existingReview]);

  const isEditing = Boolean(existingReview);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setMessage(t('errors.authRequired'));
      setStatus('error');
      return;
    }

    startTransition(async () => {
      setStatus('submitting');
      setMessage(null);
      setErrors({});

      const newImageEntries = images
        .map((image, index) => ({ image, index }))
        .filter(({ image }) => image.file && !image.uploaded);
      const filesToUpload = newImageEntries
        .map(({ image }) => image.file)
        .filter((file): file is File => file instanceof File);

      const validation = validateReviewForm({
        rating,
        title,
        comment,
        images: filesToUpload,
      });

      if (!validation.valid) {
        setStatus('error');
        setErrors(validation.errors);
        setMessage(
          translateKey(validation.errors.rating ?? validation.errors.title ?? validation.errors.comment ?? 'errors.submitFailed'),
        );
        return;
      }

      let reviewImages = [...images];

      if (newImageEntries.length > 0) {
        reviewImages = reviewImages.map((preview, idx) =>
          newImageEntries.some(({ index }) => index === idx)
            ? { ...preview, uploading: true, error: null }
            : preview,
        );
        setImages(reviewImages);

        const storageReviewId = existingReview?.id ?? crypto.randomUUID();
        const uploadResult = await uploadReviewImages(
          filesToUpload,
          user.id,
          storageReviewId,
        );

        reviewImages = reviewImages.map((preview, idx) => {
          const pendingIndex = newImageEntries.findIndex(({ index }) => index === idx);
          if (pendingIndex === -1) {
            return preview;
          }

          const result = uploadResult.results[pendingIndex];
          const errorKey = result?.error ?? null;

          return {
            ...preview,
            uploading: false,
            uploaded: Boolean(result?.url),
            url: result?.url ?? preview.url,
            error: errorKey ? translateKey(errorKey) : null,
          };
        });

        setImages(reviewImages);

        const hasUploadError = reviewImages.some(
          (preview, idx) =>
            newImageEntries.some(({ index }) => index === idx) && !preview.uploaded,
        );

        if (hasUploadError) {
          setStatus('error');
          setMessage(translateKey('errors.uploadFailed'));
          return;
        }
      }

      const imageUrls = reviewImages
        .map((preview) => preview.url)
        .filter((url): url is string => Boolean(url));

      const actionPayload = {
        rating: rating ?? 0,
        title: title.trim(),
        comment: comment.trim(),
        imageUrls,
      };

      const response = isEditing
        ? await updateReviewAction(existingReview!.id, actionPayload, {
            revalidatePath,
          })
        : await createReviewAction(productId, actionPayload, {
            revalidatePath,
          });

      if (!response.success) {
        setStatus('error');
        setMessage(translateKey(response.error ?? 'errors.submitFailed'));
        return;
      }

      setStatus('success');
      setMessage(
        translateKey(isEditing ? 'success.updated' : 'success.submitted'),
      );

      if (!isEditing) {
        setRating(null);
        setTitle('');
        setComment('');
        setImages([]);
      }

      onSuccess?.();
    });
  };

  if (!user) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-muted/40 p-6 text-center',
          className,
        )}
      >
        <Icon name="lock" className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('errors.authRequired')}
        </p>
      </div>
    );
  }

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm',
        className,
      )}
      noValidate
    >
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">
          {isEditing ? t('form.update') : t('form.title')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('form.commentPlaceholder')}</p>
      </header>

      <section className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t('form.rating')}
          </label>
          <div className="inline-flex flex-col gap-2">
            <div className="relative inline-flex">
              <StarRating rating={displayRating} size="lg" showValue={false} />
              <div className="absolute inset-0 flex">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      className="flex-1 cursor-pointer"
                      onMouseEnter={() => setHoverRating(value)}
                      onFocus={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(null)}
                      onBlur={() => setHoverRating(null)}
                      onClick={() => setRating(value)}
                      aria-label={t('stars', { count: value })}
                    />
                  );
                })}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {t('form.ratingLabel')}
            </span>
            {errors.rating && (
              <span className="text-sm text-coral-500">
                {translateKey(errors.rating)}
              </span>
            )}
          </div>
        </div>

        <Input
          label={t('form.reviewTitle')}
          placeholder={t('form.reviewTitlePlaceholder')}
          value={title}
          maxLength={100}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title ? translateKey(errors.title) : undefined}
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="review-comment">
            {t('form.comment')}
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('form.commentPlaceholder')}
            rows={6}
            className={cn(
              'w-full rounded-md border border-input bg-background p-4 text-base text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              errors.comment && 'border-coral-500 focus-visible:ring-coral-500',
            )}
            maxLength={1000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {comment.length} / 1000
            </span>
            {errors.comment && (
              <span className="text-coral-500">
                {translateKey(errors.comment)}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {t('form.images')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('form.imagesHint')}
          </span>
        </div>
        <ImageUploadInput images={images} onChange={setImages} disabled={isSubmitting} />
        {errors.images && (
          <p className="text-sm text-coral-500">
            {translateKey(errors.images)}
          </p>
        )}
      </section>

      {message && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
            status === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 animate-review-success'
              : 'bg-coral-100 text-coral-700 dark:bg-coral-900/20 dark:text-coral-400',
          )}
          role="status"
          aria-live="polite"
        >
          <Icon name={status === 'success' ? 'check' : 'alert'} className="h-4 w-4" />
          <span>{message}</span>
          {status === 'success' && !isEditing && (
            <span className="text-xs text-muted-foreground">
              {t('success.pending')}
            </span>
          )}
        </div>
      )}

      <footer className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {t('form.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            rating === null ||
            !title.trim() ||
            !comment.trim()
          }
        >
          {isEditing ? t('form.update') : t('form.submit')}
        </Button>
      </footer>
    </form>
  );
}
