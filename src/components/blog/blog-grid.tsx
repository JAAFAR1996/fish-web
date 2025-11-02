import { BlogCard } from './blog-card';
import { EmptyBlogState } from './empty-blog-state';
import type { BlogPost, Locale } from '@/types';
import { cn } from '@/lib/utils';

export interface BlogGridProps {
  posts: BlogPost[];
  locale: Locale;
  variant?: 'grid' | 'list';
  className?: string;
}

export function BlogGrid({
  posts,
  locale,
  variant = 'grid',
  className,
}: BlogGridProps) {
  if (posts.length === 0) {
    return <EmptyBlogState />;
  }

  if (variant === 'list') {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        {posts.map((post, index) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            variant="list"
            priority={index < 3}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('@container', className)}>
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            variant="grid"
            priority={index < 3}
          />
        ))}
      </div>
    </div>
  );
}
