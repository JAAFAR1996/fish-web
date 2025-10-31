import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Badge, Icon } from '@/components/ui';
import { ShareButtons } from '@/components/pdp/share-buttons';
import { formatPublishDate } from '@/lib/blog/content-utils';
import type { BlogPost, Locale } from '@/types';
import { cn } from '@/lib/utils';

export interface BlogPostHeaderProps {
  post: BlogPost;
  locale: Locale;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'filter-guide': 'bg-aqua-500',
  'plant-care': 'bg-green-500',
  'fish-compatibility': 'bg-coral-500',
  'setup-tips': 'bg-sand-500',
};

export function BlogPostHeader({
  post,
  locale,
  className,
}: BlogPostHeaderProps) {
  const t = useTranslations('blog');

  return (
    <header className={cn('space-y-6', className)}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-muted-foreground hover:text-aqua-500 transition-colors"
        >
          {t('home') || 'Home'}
        </Link>
        <Icon name="chevron-right" className="h-4 w-4 text-muted-foreground" />
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-aqua-500 transition-colors"
        >
          {t('title')}
        </Link>
        <Icon name="chevron-right" className="h-4 w-4 text-muted-foreground" />
        <Link
          href={`/blog?category=${post.category}`}
          className="text-muted-foreground hover:text-aqua-500 transition-colors"
        >
          {t(`categories.${post.category}.title`)}
        </Link>
        <Icon name="chevron-right" className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground font-medium line-clamp-1">
          {post.title}
        </span>
      </nav>

      {/* Category Badge */}
      <div>
        <Badge
          className={cn(
            'text-white',
            CATEGORY_COLORS[post.category] || 'bg-aqua-500'
          )}
        >
          <Icon name="bookmark" className="h-3 w-3 me-1" />
          {t(`categories.${post.category}.title`)}
        </Badge>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground text-balance">
        {post.title}
      </h1>

      {/* Excerpt */}
      <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
        {post.excerpt}
      </p>

      {/* Author Section */}
      <div className="flex items-center gap-4">
        {post.author.avatar && (
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">
            {post.author.name}
          </p>
          {post.author.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {post.author.bio}
            </p>
          )}
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Icon name="calendar" className="h-4 w-4" />
          <time dateTime={post.publishedAt}>
            {formatPublishDate(post.publishedAt, locale)}
          </time>
        </div>

        {post.updatedAt && post.updatedAt !== post.publishedAt && (
          <div className="flex items-center gap-2">
            <Icon name="refresh-cw" className="h-4 w-4" />
            <span>
              {t('updatedOn')} {formatPublishDate(post.updatedAt, locale)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Icon name="clock" className="h-4 w-4" />
          <span>{t('readingTime', { minutes: post.readingTime })}</span>
        </div>

        <div className="ms-auto">
          <ShareButtons
            product={{ id: post.slug, name: post.title, slug: post.slug } as any}
            locale={locale}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-border" />
    </header>
  );
}
