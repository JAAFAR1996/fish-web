"use client";

import { useEffect, useMemo, useState } from 'react';
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
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';

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
  const showInstallPrompt = process.env.NEXT_PUBLIC_SHOW_INSTALL_PROMPT !== 'false';
  const autoPrompt = process.env.NEXT_PUBLIC_PWA_AUTO_PROMPT === 'true';

  const t = useTranslations('pwa.install');
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    ready,
    isPrompting,
    promptInstall,
    snooze,
    status,
    canInstall,
  } = usePwaInstallPrompt({
    enabled: isPwaEnabled && showInstallPrompt && !isStandaloneDisplay(),
    delayMs: 45_000,
    minVisits: 3,
  });

  useEffect(() => {
    if (!autoPrompt) return;
    if (!pathname) return;
    if (ready && status === 'idle') {
      setIsModalOpen(true);
    }
  }, [autoPrompt, pathname, ready, status]);

  const benefits = useMemo(
    () => [
      { icon: 'wifi-off' as const, text: t('benefits.offline') },
      { icon: 'zap' as const, text: t('benefits.faster') },
      { icon: 'smartphone' as const, text: t('benefits.homeScreen') },
      { icon: 'bell' as const, text: t('benefits.notifications') },
    ],
    [t],
  );

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setIsModalOpen(false);
    }
  };

  const handleNotNow = () => {
    snooze();
    setIsModalOpen(false);
  };

  if (!isPwaEnabled || !showInstallPrompt || !autoPrompt) {
    return null;
  }

  return (
    <Modal
      open={isModalOpen && ready && canInstall}
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
          disabled={!ready || !canInstall || isPrompting}
          loading={isPrompting}
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
