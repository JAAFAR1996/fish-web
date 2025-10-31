"use client";

import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Card, CardContent, CardHeader, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { STYLE_COLORS } from '@/lib/gallery/constants';
import type { GalleryMedia, GallerySetupWithUser, Locale } from '@/types';
import { cn } from '@/lib/utils';

interface GalleryCardProps {
  setup: GallerySetupWithUser;
  locale: Locale;
  priority?: boolean;
  className?: string;
}

export function GalleryCard({ setup, locale, priority, className }: GalleryCardProps) {
  const tSetup = useTranslations('gallery.setup');
  const tStyles = useTranslations('gallery.styles');
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);

  const firstMedia = setup.media_urls?.[0] as string | GalleryMedia | undefined;
  const normalizedMedia: GalleryMedia | null = firstMedia
    ? typeof firstMedia === 'string'
      ? {
          type: firstMedia.toLowerCase().endsWith('.mp4') || firstMedia.includes('/video/') ? 'video' : 'image',
          url: firstMedia,
          order: 0,
        }
      : {
          type: firstMedia.type === 'video' ? 'video' : 'image',
          url: firstMedia.url,
          thumbnail: firstMedia.thumbnail,
          order: firstMedia.order ?? 0,
        }
    : null;

  const coverImage =
    normalizedMedia?.type === 'video'
      ? normalizedMedia.thumbnail ?? null
      : normalizedMedia?.url ?? null;
  const mediaCount = setup.media_urls?.length ?? 0;
  const isVideoCover = normalizedMedia?.type === 'video';
  const styleColor = STYLE_COLORS[setup.style] ?? 'bg-muted text-foreground';
  const styleLabel = tStyles(setup.style);
  const authorName = setup.user?.full_name?.trim();
  const submittedBy = authorName
    ? tSetup('submittedBy', { name: authorName })
    : tSetup('submittedByAnonymous');
  const formattedTankSize = tSetup('tankSizeValue', { size: numberFormatter.format(setup.tank_size) });
  const formattedDate = dateFormatter.format(new Date(setup.created_at));
  const formattedViews = tSetup('viewCount', {
    count: setup.view_count,
    countFormatted: numberFormatter.format(setup.view_count),
  });
  const formattedMedia = tSetup('mediaCount', {
    count: mediaCount,
    countFormatted: numberFormatter.format(mediaCount),
  });

  return (
    <Card className={cn('group relative overflow-hidden hover:shadow-lg transition', className)}>
      <Link href={`/gallery/${setup.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={setup.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Icon name={isVideoCover ? 'play' : 'image'} className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge className={styleColor}>{styleLabel}</Badge>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>{formattedViews}</span>
            <span>{formattedMedia}</span>
          </div>
          {isVideoCover && coverImage && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
              <Icon name="play" className="h-10 w-10 drop-shadow-lg" />
            </div>
          )}
        </div>
        <CardHeader className="px-3 pt-3">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{setup.title}</h3>
        </CardHeader>
      </Link>
      <CardContent className="px-3 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formattedTankSize} • {submittedBy}</span>
          <span>{formattedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
