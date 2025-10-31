'use client';

import Script from 'next/script';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

const DEFAULT_SCRIPT_URL = 'https://plausible.io/js/script.js';

export default function PlausibleAnalytics() {
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
      defer
    />
  );
}

export function trackEvent(eventName: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.plausible?.(eventName, props ? { props } : undefined);
}
