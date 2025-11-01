import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Badge, Icon } from '@/components/ui';
import type { BlogCategory, BlogCategoryInfo } from '@/types';
import { cn } from '@/lib/utils';

export interface BlogCategoriesProps {
  categories: BlogCategoryInfo[];
  activeCategory: BlogCategory | null;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'aqua-500': 'bg-aqua-500 hover:bg-aqua-600 border-aqua-500',
  'green-500': 'bg-green-500 hover:bg-green-600 border-green-500',
  'coral-500': 'bg-coral-500 hover:bg-coral-600 border-coral-500',
  'sand-500': 'bg-sand-500 hover:bg-sand-600 border-sand-500',
};

export function BlogCategories({
  categories,
  activeCategory,
  className,
}: BlogCategoriesProps) {
  const t = useTranslations('blog');

  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0);

  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto scrollbar-hide md:grid md:grid-cols-5 md:gap-4',
        className
      )}
      role="group"
      aria-label="Filter blog posts by category"
    >
      <Link
        href="/blog"
        className={cn(
          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all whitespace-nowrap',
          activeCategory === null
            ? 'bg-aqua-500 text-white border-aqua-500'
            : 'border-border hover:border-aqua-500 bg-card'
        )}
        aria-current={activeCategory === null ? 'page' : undefined}
      >
        <Icon name="grid" className="h-5 w-5" />
        <span className="text-sm font-medium">{t('categories.all')}</span>
        <Badge variant="outline" className="text-xs">
          {totalPosts}
        </Badge>
      </Link>

      {categories.map((category) => {
        const isActive = activeCategory === category.key;
        const colorClass = CATEGORY_COLORS[category.color] || 'bg-aqua-500';

        return (
          <Link
            key={category.key}
            href={`/blog?category=${category.key}`}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all whitespace-nowrap',
              isActive
                ? `${colorClass} text-white`
                : 'border-border hover:border-aqua-500 bg-card'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon name={category.icon} className="h-5 w-5" />
            <span className="text-sm font-medium">
              {t(`categories.${category.key}.title`)}
            </span>
            <Badge variant="outline" className="text-xs">
              {category.postCount}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
