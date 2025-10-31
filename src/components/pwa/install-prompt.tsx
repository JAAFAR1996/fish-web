"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import {
  Badge,
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PROMPT_DISMISSED_KEY = 'fishweb-pwa-install-dismissed-at';
const PROMPT_ACCEPTED_KEY = 'fishweb-pwa-install-accepted-at';
const PROMPT_PAGE_VIEWS_KEY = 'fishweb-pwa-page-views';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const INITIAL_DELAY_MS = 30 * 1000; // 30 seconds

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - iOS specific property
    window.navigator.standalone === true
  );
};

export function InstallPrompt() {
  const isPwaEnabled = process.env.NEXT_PUBLIC_PWA_ENABLED !== 'false';
  const showInstallPrompt =
    process.env.NEXT_PUBLIC_SHOW_INSTALL_PROMPT !== 'false';

  const t = useTranslations('pwa.install');
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isEligible, setIsEligible] = useState(false);

  const hasDismissedRecently = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (!dismissedAt) return false;
      const timestamp = Number(dismissedAt);
      if (Number.isNaN(timestamp)) return false;
      return Date.now() - timestamp < DISMISS_DURATION_MS;
    } catch {
      return false;
    }
  }, []);

  const hasAccepted = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem(PROMPT_ACCEPTED_KEY));
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isPwaEnabled || !showInstallPrompt) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    if (!pathname) {
      return;
    }
    if (hasAccepted()) {
      return;
    }
    try {
      const views =
        Number(localStorage.getItem(PROMPT_PAGE_VIEWS_KEY) ?? '0') + 1;
      localStorage.setItem(PROMPT_PAGE_VIEWS_KEY, String(views));
      if (views >= 3) {
        setIsEligible(true);
      }
    } catch {
      /* noop */
    }
  }, [pathname, hasAccepted, isPwaEnabled, showInstallPrompt]);

  useEffect(() => {
    if (!isPwaEnabled || !showInstallPrompt) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsEligible(true);
    }, INITIAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isPwaEnabled, showInstallPrompt]);

  useEffect(() => {
    if (!isPwaEnabled || !showInstallPrompt) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    if (isStandaloneDisplay() || hasAccepted()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsModalOpen(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(PROMPT_ACCEPTED_KEY, Date.now().toString());
      } catch {
        /* noop */
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [hasAccepted, isPwaEnabled, showInstallPrompt]);

  useEffect(() => {
    if (
      !isPwaEnabled ||
      !showInstallPrompt ||
      !deferredPrompt ||
      !isEligible
    ) {
      return;
    }
    if (typeof window === 'undefined') return;
    if (isStandaloneDisplay() || hasAccepted() || hasDismissedRecently()) {
      return;
    }
    setIsModalOpen(true);
  }, [
    deferredPrompt,
    hasAccepted,
    hasDismissedRecently,
    isEligible,
    isPwaEnabled,
    showInstallPrompt,
  ]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        try {
          localStorage.setItem(PROMPT_ACCEPTED_KEY, Date.now().toString());
        } catch {
          /* noop */
        }
        setIsModalOpen(false);
      } else {
        try {
          localStorage.setItem(
            PROMPT_DISMISSED_KEY,
            Date.now().toString(),
          );
        } catch {
          /* noop */
        }
        setIsModalOpen(false);
      }
    } catch {
      setIsModalOpen(false);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleNotNow = useCallback(() => {
    setIsModalOpen(false);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    } catch {
      /* noop */
    }
  }, []);

  const benefits = useMemo(
    () => [
      { icon: 'wifi-off' as const, text: t('benefits.offline') },
      { icon: 'zap' as const, text: t('benefits.faster') },
      { icon: 'smartphone' as const, text: t('benefits.homeScreen') },
      { icon: 'bell' as const, text: t('benefits.notifications') },
    ],
    [t],
  );

  if (!isPwaEnabled || !showInstallPrompt) {
    return null;
  }

  return (
    <Modal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      title={t('title')}
      description={t('description')}
      size="md"
    >
      <ModalHeader className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aqua-500 text-white shadow-md">
          <Icon name="download" className="h-8 w-8 animate-icon-bounce" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{t('title')}</p>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.icon}
              className="flex items-start gap-3 rounded-lg border border-border bg-background/80 p-3"
            >
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-aqua-500/10 text-aqua-600 dark:text-aqua-400">
                <Icon name={benefit.icon} className="h-4 w-4" aria-hidden />
              </div>
              <p className="text-sm text-muted-foreground">{benefit.text}</p>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleNotNow}
          className="w-full sm:w-auto"
        >
          {t('notNow')}
        </Button>
        <Button
          type="button"
          variant="primary"
          className="w-full sm:w-auto"
          onClick={handleInstall}
          disabled={!deferredPrompt || isInstalling}
          isLoading={isInstalling}
        >
          <Icon name="download" className="h-4 w-4" aria-hidden />
          {t('install')}
        </Button>
      </ModalFooter>
      <div className="px-6 pb-4">
        <Badge className="animate-pwa-badge-pulse bg-aqua-500/15 text-aqua-700 dark:text-aqua-400">
          PWA
        </Badge>
      </div>
    </Modal>
  );
}
