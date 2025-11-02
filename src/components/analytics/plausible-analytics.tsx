'use client';

import Script from 'next/script';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

const DEFAULT_SCRIPT_URL = 'https://plausible.io/js/script.js';

type PlausibleAnalyticsProps = {
  nonce?: string;
};

export default function PlausibleAnalytics({ nonce }: PlausibleAnalyticsProps = {}) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const scriptUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL ?? DEFAULT_SCRIPT_URL;

  if (!domain) {
    return null;
  }

  return (
    <Script
      src={scriptUrl}
      data-domain={domain}
      strategy="afterInteractive"
      nonce={nonce}
      defer
    />
  );
}

export function trackEvent(eventName: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.plausible?.(eventName, props ? { props } : undefined);
}
