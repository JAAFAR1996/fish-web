'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

type CartToastProps = {
  productName: string | null;
  onClose: () => void;
};

export function CartToast({ productName, onClose }: CartToastProps) {
  const t = useTranslations('cart.success');
  const locale = useLocale();
  const isRtl = useMemo(() => locale === 'ar', [locale]);

  useEffect(() => {
    if (!productName) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [onClose, productName]);

  if (!productName || typeof document === 'undefined') {
    return null;
  }

  const message = t('addedWithName', { name: productName });

  return createPortal(
    <div
      className={cn(
        'fixed top-20 z-[60] flex w-full max-w-sm items-center gap-3 rounded-xl border border-border/70 bg-background/95 px-4 py-3 shadow-xl ring-1 ring-border/60 backdrop-blur',
        isRtl ? 'start-4' : 'end-4',
        'motion-safe:animate-fade-in'
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        <Icon name="check-circle" size="sm" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          {t('miniCartPrompt')}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('close')}
        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        onClick={onClose}
      >
        <Icon name="close" size="sm" aria-hidden />
      </Button>
    </div>,
    document.body
  );
}
