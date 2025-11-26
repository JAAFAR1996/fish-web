/* eslint-disable @next/next/no-document-import-in-page */
'use client';

import * as Sentry from '@sentry/nextjs';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  Sentry.captureException(error);

  return (
    <html>
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-200 break-words">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-gray-200 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
