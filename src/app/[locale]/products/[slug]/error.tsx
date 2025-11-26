'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // TODO: send to Sentry/monitoring
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 px-6 py-10 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-foreground">عذراً، حدث خطأ في تحميل المنتج</h2>
      <p className="text-sm text-muted-foreground">
        حاول إعادة المحاولة أو تواصل معنا إذا استمرت المشكلة.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-aqua-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-aqua-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          إعادة المحاولة
        </button>
        <a
          href="/contact"
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          تواصل معنا
        </a>
      </div>
    </div>
  );
}
