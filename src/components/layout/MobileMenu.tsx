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

import { CATEGORIES, type CategoryKey } from './navigation-data';

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

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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
                  <span>{tCategories(`${category.key}.title`)}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <ul className="space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory}>
                        <Link
                          href={`/products/${category.key}/${subcategory}`}
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
        </div>
      </div>
    </div>
  );
}
