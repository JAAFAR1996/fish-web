import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface SearchEmptyStateProps {
  query: string;
  suggestions?: string[];
  className?: string;
}

export function SearchEmptyState({
  query,
  suggestions,
  className,
}: SearchEmptyStateProps) {
  const t = useTranslations('search.results');
  const tActions = useTranslations('search.actions');

  const tips = suggestions ?? [
    t('checkSpelling'),
    t('tryDifferent'),
    t('tryBroader'),
    t('browseCategories'),
  ];

  return (
    <section
      className={cn(
        'flex min-h-[360px] flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon name="search" size="lg" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('noResults')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('noResultsFor', { query })}
        </p>
      </div>

      <div className="space-y-3 text-start text-sm text-muted-foreground">
        <p className="text-center font-medium text-foreground">{t('suggestions')}</p>
        <ul className="list-inside list-disc space-y-2">
          {tips.map((tip, index) => (
            <li key={`${tip}-${index}`}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="primary">
          <Link href="/products">{tActions('search')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">{t('browseCategories')}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">
            <Icon name="help" className="me-2 h-4 w-4" aria-hidden />
            {tActions('contactSupport') ?? t('tryDifferent')}
          </Link>
        </Button>
      </div>
    </section>
  );
}
