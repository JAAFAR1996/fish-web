'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Icon,
} from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';

import { CATEGORIES } from './navigation-data';

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const tNav = useTranslations('nav');
  const tCategories = useTranslations('categories');
  const tSubcategories = useTranslations('subcategories');
  const locale = useLocale();
  const isRtl = useMemo(() => locale === 'ar', [locale]);
  const [isVisible, setIsVisible] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const isPwaEnabled = process.env.NEXT_PUBLIC_PWA_ENABLED !== 'false';

  const {
    ready: installReady,
    isPrompting: isInstalling,
    promptInstall,
    status: installStatus,
    canInstall,
  } = usePwaInstallPrompt({
    enabled: isPwaEnabled,
    delayMs: 45_000,
    minVisits: 2,
  });

  const focusableSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) {
        return;
      }

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      );

      if (!focusableElements.length) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [focusableSelector]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      trapFocus(event);
    },
    [onClose, trapFocus]
  );

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches) {
      setIsVisible(true);
      return () => setIsVisible(false);
    }

    const frame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      window.cancelAnimationFrame(frame);
      setIsVisible(false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedElement.current =
      (document.activeElement as HTMLElement) ?? null;
    closeButtonRef.current?.focus();

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocusedElement.current?.focus();
      previouslyFocusedElement.current = null;
    };
  }, [handleKeyDown, isOpen]);

  const handleInstallClick = useCallback(async () => {
    const outcome = await promptInstall();
    if (outcome === 'unavailable' || outcome === 'ineligible') {
      setInstallMessage(
        locale === 'ar'
          ? 'يمكنك تثبيت التطبيق من خيار "إضافة للشاشة الرئيسية" في المتصفح.'
          : 'Use your browser’s “Add to Home Screen” option to install.',
      );
    } else {
      setInstallMessage(null);
      if (outcome === 'dismissed') {
        onClose();
      }
    }
  }, [locale, onClose, promptInstall]);

  if (!isOpen) {
    return null;
  }

  const panelAnimationClass = isRtl
    ? 'motion-safe:animate-slide-in-left'
    : 'motion-safe:animate-slide-in-right';
  const baseTranslate = isRtl ? '-translate-x-full' : 'translate-x-full';

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm motion-safe:animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={tNav('menu')}
        tabIndex={-1}
        className={cn(
          'fixed top-0 bottom-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-2xl outline-none',
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:transform-gpu',
          isRtl ? 'start-0' : 'end-0',
          baseTranslate,
          panelAnimationClass,
          isVisible && 'translate-x-0'
        )}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">{tNav('menu')}</h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="sm"
            aria-label={tNav('closeMenu')}
            onClick={onClose}
            className="rounded-full p-2"
          >
            <Icon name="close" size="sm" aria-hidden="true" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <Accordion
            type="multiple"
            className="space-y-2"
          >
            {CATEGORIES.map((category) => (
              <AccordionItem
                key={category.key}
                value={category.key}
                className="border border-border/60 rounded-lg bg-muted/30 px-2"
              >
                <AccordionTrigger className="flex w-full items-center justify-between gap-2 py-3 text-start font-medium">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-aqua-600 shadow-sm ring-1 ring-border/70">
                      <Icon name={category.icon} size="sm" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">
                        {tCategories(`${category.key}.title`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tCategories(`${category.key}.titleEn`)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <ul className="space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory}>
                        <Link
                          href={{
                            pathname: '/products',
                            query: { category: category.key, subcategory },
                          }}
                          className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          onClick={onClose}
                        >
                          {tSubcategories(`${category.key}.${subcategory}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-6 space-y-2">
            <Link
              href="/search"
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onClose}
            >
              {locale === 'ar' ? 'البحث' : 'Search'}
            </Link>
            <Link
              href="/auth"
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onClose}
            >
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
            <Link
              href="/about"
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onClose}
            >
              {locale === 'ar' ? 'من نحن' : 'About'}
            </Link>
            <Link
              href="/support"
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onClose}
            >
              {locale === 'ar' ? 'الدعم' : 'Support'}
            </Link>
            {isPwaEnabled && (
              <div className="rounded-md border border-dashed border-aqua-200 bg-aqua-50/60 px-3 py-3 dark:border-aqua-500/40 dark:bg-aqua-500/5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={!installReady || !canInstall || isInstalling}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm font-semibold',
                    !installReady || !canInstall
                      ? 'cursor-not-allowed text-muted-foreground'
                      : 'text-aqua-700 hover:bg-aqua-100 dark:text-aqua-200 dark:hover:bg-aqua-900/40',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon name="download" size="sm" aria-hidden />
                    {locale === 'ar' ? 'تثبيت التطبيق' : 'Install app'}
                  </span>
                  {isInstalling && (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-aqua-500" aria-hidden />
                  )}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  {installMessage ??
                    (installStatus === 'idle' ||
                    installStatus === 'ineligible' ||
                    installStatus === 'unavailable'
                      ? locale === 'ar'
                        ? 'سيظهر زر التثبيت بعد بضع زيارات أو عند دعم المتصفح.'
                        : 'Install becomes available after a few visits when supported by your browser.'
                      : '')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
