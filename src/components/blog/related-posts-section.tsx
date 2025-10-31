import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button, Icon } from '@/components/ui';
import { BlogCard } from './blog-card';
import type { BlogPost, Locale } from '@/types';
import { cn } from '@/lib/utils';

export interface RelatedPostsSectionProps {
  posts: BlogPost[];
  currentPost: BlogPost;
  locale: Locale;
  className?: string;
}

export function RelatedPostsSection({
  posts,
  currentPost,
  locale,
  className,
}: RelatedPostsSectionProps) {
  const t = useTranslations('blog');

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className={cn('bg-muted py-12 border-t border-border', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('relatedArticles')}
            </h2>
            <p className="text-muted-foreground">
              {t('inCategory', {
                category: t(`categories.${currentPost.category}.title`),
              })}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/blog?category=${currentPost.category}`}>
              {t('viewAllInCategory', {
                category: t(`categories.${currentPost.category}.title`),
              })}
              <Icon name="arrow-right" className="h-4 w-4 ms-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              locale={locale}
              variant="grid"
              priority={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
