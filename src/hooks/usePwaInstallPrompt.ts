"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PROMPT_DISMISSED_KEY = 'fishweb-pwa-install-dismissed-at';
const PROMPT_ACCEPTED_KEY = 'fishweb-pwa-install-accepted-at';
const PROMPT_PAGE_VIEWS_KEY = 'fishweb-pwa-page-views';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_DELAY_MS = 45 * 1000; // 45 seconds
const DEFAULT_MIN_VISITS = 3;

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable' | 'ineligible';
export type InstallStatus = InstallOutcome | 'idle';

function readTimestamp(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeTimestamp(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* noop */
  }
}

export function usePwaInstallPrompt(options?: {
  enabled?: boolean;
  delayMs?: number;
  minVisits?: number;
}) {
  const enabled = options?.enabled ?? true;
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  const minVisits = options?.minVisits ?? DEFAULT_MIN_VISITS;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [status, setStatus] = useState<InstallStatus>('idle');

  const hasAccepted = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const acceptedAt = readTimestamp(PROMPT_ACCEPTED_KEY);
    return typeof acceptedAt === 'number';
  }, []);

  const hasDismissedRecently = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const dismissedAt = readTimestamp(PROMPT_DISMISSED_KEY);
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }
    if (hasAccepted()) {
      return;
    }
    const views = Number(localStorage.getItem(PROMPT_PAGE_VIEWS_KEY) ?? '0') + 1;
    try {
      localStorage.setItem(PROMPT_PAGE_VIEWS_KEY, String(views));
    } catch {
      /* noop */
    }
    if (views >= minVisits) {
      setIsEligible(true);
    }
  }, [enabled, hasAccepted, minVisits]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }
    const timer = window.setTimeout(() => setIsEligible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, enabled]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      writeTimestamp(PROMPT_ACCEPTED_KEY, Date.now());
      setStatus('accepted');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [enabled]);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!enabled) {
      setStatus('ineligible');
      return 'ineligible';
    }
    if (!deferredPrompt || hasAccepted()) {
      setStatus('unavailable');
      return 'unavailable';
    }
    if (hasDismissedRecently()) {
      setStatus('ineligible');
      return 'ineligible';
    }
    if (!isEligible) {
      setStatus('ineligible');
      return 'ineligible';
    }

    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      const outcome = choice.outcome as InstallOutcome;
      if (outcome === 'accepted') {
        writeTimestamp(PROMPT_ACCEPTED_KEY, Date.now());
      } else {
        writeTimestamp(PROMPT_DISMISSED_KEY, Date.now());
      }
      setStatus(outcome);
      setDeferredPrompt(null);
      return outcome;
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt, enabled, hasAccepted, hasDismissedRecently, isEligible]);

  const snooze = useCallback(() => {
    writeTimestamp(PROMPT_DISMISSED_KEY, Date.now());
    setStatus('dismissed');
  }, []);

  const ready = useMemo(
    () =>
      enabled &&
      Boolean(deferredPrompt) &&
      isEligible &&
      !hasDismissedRecently() &&
      !hasAccepted(),
    [deferredPrompt, enabled, hasAccepted, hasDismissedRecently, isEligible],
  );

  return {
    canInstall: Boolean(deferredPrompt),
    ready,
    isEligible,
    isPrompting,
    status,
    promptInstall,
    snooze,
    resetPrompt: () => setDeferredPrompt(null),
  };
}
