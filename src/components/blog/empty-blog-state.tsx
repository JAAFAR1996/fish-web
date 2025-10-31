import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button, Icon } from '@/components/ui';
import type { BlogCategory } from '@/types';
import { cn } from '@/lib/utils';

export interface EmptyBlogStateProps {
  category?: BlogCategory | null;
  className?: string;
}

export function EmptyBlogState({ category, className }: EmptyBlogStateProps) {
  const t = useTranslations('blog');

  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 min-h-[400px]',
        className
      )}
    >
      <Icon name="book" className="h-16 w-16 text-muted-foreground mb-4" />
      
      <h3 className="text-2xl font-semibold text-foreground mb-2">
        {category ? t('noPostsInCategory', { category }) : t('noPosts')}
      </h3>
      
      <p className="text-base text-muted-foreground mb-6">
        {t('comingSoon')}
      </p>

      <Button variant="primary" size="lg" asChild>
        <Link href="/blog">
          {t('browseAll')}
          <Icon name="arrow-right" className="h-4 w-4 ms-2" />
        </Link>
      </Button>
    </section>
  );
}
