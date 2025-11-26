'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import * as Sentry from '@sentry/nextjs';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductsError({ error, reset }: ErrorProps) {
  const tResults = useTranslations('plp.results');
  const tCommon = useTranslations('common');

  useEffect(() => {
    console.error('Product listing error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-foreground">{tResults('error')}</h2>
      <p className="text-sm text-muted-foreground">
        {tResults('fallbackDescription')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-aqua-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-aqua-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {tCommon('retry')}
        </button>
        <a
          href="/support"
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {tResults('contactSupport')}
        </a>
      </div>
    </div>
  );
}
