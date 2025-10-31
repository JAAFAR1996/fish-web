"use client";

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import type { GalleryStyle, Hotspot } from '@/types';
import { GALLERY_STYLES, MAX_GALLERY_MEDIA } from '@/lib/gallery/constants';
import { uploadGalleryImages } from '@/lib/gallery/image-upload';
import { createSetupAction } from '@/lib/gallery/gallery-actions';
import { ImageUploadInput } from '@/components/reviews/image-upload-input';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { HotspotEditor } from '@/components/gallery/hotspot-editor';

interface SetupSubmissionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function SetupSubmissionForm({ onSuccess, onCancel, className }: SetupSubmissionFormProps) {
  const t = useTranslations('gallery.form');
  const errorMessages = useTranslations('gallery.errors');
  const validationMessages = useTranslations('gallery.validation');
  const galleryMessages = useTranslations('gallery');
  const locale = useLocale();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tankSize, setTankSize] = useState<number>(0);
  const [style, setStyle] = useState<GalleryStyle>('planted');
  const [images, setImages] = useState<{ file: File | null; preview: string }[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [uploadErrorKey, setUploadErrorKey] = useState<string | null>(null);

  const [setupId] = useState(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `setup-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  });

  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const numberOfFiles = useMemo(() => images.filter((img) => Boolean(img.file)).length, [images]);

  const canContinue = () => {
    if (step === 1) return !!title.trim() && tankSize > 0 && style && !isLoading && !!user;
    if (step === 2) return numberOfFiles > 0;
    return true;
  };

  const handleNextStep = () => {
    if (!canContinue()) return;
    setStatusKey(null);
    setUploadErrorKey(null);
    setStep((s) => ((s + 1) as any));
  };

  const handlePreviousStep = () => {
    setStatusKey(null);
    setUploadErrorKey(null);
    setStep((s) => (s > 1 ? ((s - 1) as any) : s));
  };

  const translateMessage = (key: string): string => {
    if (key.startsWith('gallery.form.')) return t(key.replace('gallery.form.', ''));
    if (key.startsWith('gallery.validation.')) {
      return validationMessages(key.replace('gallery.validation.', ''));
    }
    if (key.startsWith('gallery.errors.')) {
      return errorMessages(key.replace('gallery.errors.', ''));
    }
    if (key.startsWith('gallery.')) {
      return galleryMessages(key.replace('gallery.', ''));
    }
    return key;
  };

  const handleSubmit = async () => {
    if (!user) {
      setStatusKey('gallery.form.signInRequired');
      return;
    }
    setIsSubmitting(true);
    setStatusKey(null);
    setUploadErrorKey(null);
    try {
      const files = images.map((i) => i.file).filter((f): f is File => Boolean(f));
      const { urls, errors } = await uploadGalleryImages(files, user.id, setupId);
      if (!urls.length) {
        setUploadErrorKey(errors[0] ?? 'gallery.errors.createFailed');
        return;
      }
      if (errors.length) {
        setUploadErrorKey(errors[0]);
      }
      const res = await createSetupAction({
        title,
        description,
        tankSize,
        style,
        mediaUrls: urls,
        hotspots,
      });
      if (!res.success) {
        setStatusKey(res.error ?? 'gallery.errors.createFailed');
        return;
      }
      setStatusKey('gallery.form.pending');
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('submit')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!isLoading && !user && (
              <div className="md:col-span-2 rounded-md border border-dashed border-input bg-muted/40 p-3 text-sm text-muted-foreground">
                {t('signInRequired')}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('title')}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('tankSize')}</label>
              <Input type="number" min={1} value={tankSize} onChange={(e) => setTankSize(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium">{t('style')}</label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-sm"
                value={style}
                onChange={(e) => setStyle(e.target.value as GalleryStyle)}
              >
                {GALLERY_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium">{t('description')}</label>
              <textarea className="min-h-[100px] w-full rounded-md border border-input bg-background p-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <ImageUploadInput
              images={images.map((i) => ({ file: i.file, preview: i.preview, uploading: false, uploaded: Boolean(i.file), url: null, error: null }))}
              onChange={(previews) => {
                const nextImages = previews.map((p) => ({ file: p.file, preview: p.preview }));
                setImages(nextImages);
                if (nextImages.length === 0) {
                  setHotspots([]);
                }
              }}
              maxImages={MAX_GALLERY_MEDIA}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {images.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('uploadMediaFirst')}</p>
            )}
            {images.length > 0 && images[0]?.preview && (
              <HotspotEditor imageUrl={images[0].preview} hotspots={hotspots} onChange={setHotspots} />
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t('reviewSummary', { title: title || t('untitled') })}</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>{t('summary.mediaCount', { count: numberOfFiles, countFormatted: formatter.format(numberOfFiles) })}</li>
              <li>{t('summary.hotspotCount', { count: hotspots.length, countFormatted: formatter.format(hotspots.length) })}</li>
            </ul>
          </div>
        )}

        {uploadErrorKey && (
          <div className="text-sm text-destructive">{translateMessage(uploadErrorKey)}</div>
        )}
        {statusKey && <div className="text-sm text-foreground">{translateMessage(statusKey)}</div>}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isSubmitting}>
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNextStep}
              disabled={!canContinue() || isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
