"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

const OFFLINE_BANNER_DISMISSED_KEY = 'fishweb-offline-banner-dismissed';

export function OfflineIndicator() {
  const isPwaEnabled = process.env.NEXT_PUBLIC_PWA_ENABLED !== 'false';
  const offlineModeEnabled =
    process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED !== 'false';

  const t = useTranslations('pwa.offline');
  const [isOnline, setIsOnline] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isPwaEnabled || !offlineModeEnabled) {
      return;
    }

    const initialOnline =
      typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(initialOnline);

    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      try {
        localStorage.removeItem(OFFLINE_BANNER_DISMISSED_KEY);
      } catch {
        /* noop */
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      try {
        localStorage.removeItem(OFFLINE_BANNER_DISMISSED_KEY);
      } catch {
        /* noop */
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const dismissed = localStorage.getItem(OFFLINE_BANNER_DISMISSED_KEY);
      if (dismissed) {
        setIsDismissed(true);
      }
    } catch {
      /* noop */
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isPwaEnabled, offlineModeEnabled]);

  if (!isPwaEnabled || !offlineModeEnabled) {
    return null;
  }

  if (isOnline || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(OFFLINE_BANNER_DISMISSED_KEY, Date.now().toString());
    } catch {
      /* noop */
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed left-0 right-0 top-16 z-40 px-4 sm:px-6"
    >
      <div
        className={cn(
          'animate-slide-down rounded-md bg-coral-500 px-4 py-3 text-sm text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6',
          'border border-white/20'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon name="wifi-off" className="h-5 w-5" aria-hidden="true" />
          <span>{t('indicator')}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10 focus-visible:ring-white"
            onClick={handleDismiss}
          >
            <Icon name="x" className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t('dismiss')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
