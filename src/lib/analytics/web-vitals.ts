import type { NextWebVitalsMetric } from 'next/app';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window !== 'undefined') {
    window.plausible?.('Web Vitals', {
      props: {
        metric: metric.name,
        value: Math.round(metric.value),
        label: metric.label,
        id: metric.id,
      },
    });

    window.gtag?.('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[web-vitals]', metric);
  }
}
