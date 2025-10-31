import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui';
import { highlightSearchTerms } from '@/lib/search/highlight-utils';
import { cn } from '@/lib/utils';

export interface SearchResultsHeaderProps {
  query: string;
  resultCount: number;
  className?: string;
}

export function SearchResultsHeader({
  query,
  resultCount,
  className,
}: SearchResultsHeaderProps) {
  const t = useTranslations('search.results');
  const summary = t('showingFor', { count: resultCount, query });

  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-2 border-b border-border pb-6',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon name="search" size="sm" aria-hidden />
        <span>{highlightSearchTerms(t('resultsFor', { query }), query)}</span>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        {highlightSearchTerms(`"${query}"`, query)}
      </h1>
      <p className="text-sm text-muted-foreground">
        {highlightSearchTerms(summary, query)}
      </p>
    </header>
  );
}
