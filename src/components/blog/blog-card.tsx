import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Card, CardContent, Badge, Icon } from '@/components/ui';
import { formatPublishDate } from '@/lib/blog/content-utils';
import { BLOG_CATEGORIES } from '@/lib/blog/constants';
import { cn } from '@/lib/utils';
import type { BlogPost, Locale } from '@/types';

export interface BlogCardProps {
  post: BlogPost;
  locale: Locale;
  variant?: 'grid' | 'list';
  priority?: boolean;
  className?: string;
}

export function BlogCard({
  post,
  locale,
  variant = 'grid',
  priority = false,
  className,
}: BlogCardProps) {
  const t = useTranslations('blog');
  const categoryInfo = BLOG_CATEGORIES.find((cat) => cat.key === post.category);
  const categoryColor = categoryInfo?.color || 'bg-aqua-500';

  return (
    <Card
      hoverable
      className={cn(
        'group overflow-hidden transition-all duration-300',
        variant === 'list' && 'flex flex-col md:flex-row',
        className
      )}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className={cn(
          'relative overflow-hidden bg-muted',
          variant === 'grid' ? 'aspect-video' : 'md:w-64 md:h-full aspect-video md:aspect-auto'
        )}>
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
          <div className="absolute top-2 start-2">
            <Badge variant="default" className={cn(categoryColor, 'text-white')}>
              <Icon name="bookmark" className="h-3 w-3 me-1" />
              {t(`categories.${post.category}.title`)}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className={cn(
        'flex flex-col gap-3 p-6',
        variant === 'list' && 'flex-1'
      )}>
        <Link 
          href={`/blog/${post.slug}`}
          className="text-xl font-semibold text-foreground line-clamp-2 hover:text-aqua-500 transition-colors"
        >
          {post.title}
        </Link>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {post.author.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full object-cover"
                loading="lazy"
              />
            )}
            <span>{post.author.name}</span>
          </div>
          <span>•</span>
          <time dateTime={post.publishedAt}>
            {formatPublishDate(post.publishedAt, locale)}
          </time>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Icon name="clock" className="h-3 w-3" />
            <span>{t('readingTime', { minutes: post.readingTime })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
