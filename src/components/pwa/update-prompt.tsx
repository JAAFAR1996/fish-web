"use client";

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';

const isPwaEnabled = process.env.NEXT_PUBLIC_PWA_ENABLED !== 'false';

export function UpdatePrompt() {
  const t = useTranslations('pwa.update');
  const [waitingWorker, setWaitingWorker] =
    useState<ServiceWorker | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isPwaEnabled) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let mounted = true;

    const listenForWaitingWorker = (reg: ServiceWorkerRegistration) => {
      if (!reg) return;
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setIsVisible(true);
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && reg.waiting) {
            setWaitingWorker(reg.waiting);
            setIsVisible(true);
          }
        });
      });
    };

    navigator.serviceWorker.ready
      .then((reg) => {
        if (!mounted) return;
        listenForWaitingWorker(reg);
      })
      .catch(() => {});

    const handleControllerChange = () => {
      setIsVisible(false);
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    );

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
    };
  }, []);

  const handleReload = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setIsVisible(false);
    setWaitingWorker(null);
    window.location.reload();
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setWaitingWorker(null);
  }, []);

  if (!isPwaEnabled || !isVisible || !waitingWorker) {
    return null;
  }

  return (
    <div className="fixed bottom-4 start-0 end-0 z-40 flex justify-center px-4 sm:px-6">
      <div className="flex w-full max-w-lg items-center justify-between gap-4 rounded-md border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <Icon name="download" className="h-5 w-5 text-aqua-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('available')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDismiss}
          >
            {t('later')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleReload}
          >
            <Icon name="refresh-ccw" className="h-4 w-4" aria-hidden />
            {t('updateNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
