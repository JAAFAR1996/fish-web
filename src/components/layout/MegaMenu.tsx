'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

import { CATEGORIES, type CategoryKey } from './navigation-data';

type MegaMenuProps = {
  className?: string;
};

const OPEN_DELAY = 120;
const CLOSE_DELAY = 150;

export function MegaMenu({ className }: MegaMenuProps) {
  const tCategories = useTranslations('categories');
  const tSubcategories = useTranslations('subcategories');

  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);

  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const buttonRefs = useRef<Record<CategoryKey, HTMLButtonElement | null>>(
    {} as Record<CategoryKey, HTMLButtonElement | null>
  );
  const panelRefs = useRef<Record<CategoryKey, HTMLDivElement | null>>(
    {} as Record<CategoryKey, HTMLDivElement | null>
  );

  const categoryKeys = useMemo(
    () => CATEGORIES.map((category) => category.key),
    []
  );

  const activeCategoryConfig = useMemo(
    () => CATEGORIES.find((category) => category.key === activeCategory) ?? null,
    [activeCategory]
  );

  const clearTimers = useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (key: CategoryKey) => {
      clearTimers();
      openTimeoutRef.current = window.setTimeout(() => {
        setActiveCategory(key);
      }, OPEN_DELAY);
    },
    [clearTimers]
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveCategory(null);
    }, CLOSE_DELAY);
  }, [clearTimers]);

  const focusFirstSubcategory = useCallback((key: CategoryKey) => {
    const firstLink =
      panelRefs.current[key]?.querySelector<HTMLAnchorElement>('a');
    if (firstLink) {
      firstLink.focus();
    }
  }, []);

  const handleCategoryKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, key: CategoryKey) => {
      const index = categoryKeys.indexOf(key);
      const prevKey =
        categoryKeys[(index - 1 + categoryKeys.length) % categoryKeys.length];
      const nextKey = categoryKeys[(index + 1) % categoryKeys.length];
      const dir =
        typeof document !== 'undefined'
          ? document.documentElement?.dir ?? document.body?.dir ?? 'ltr'
          : 'ltr';
      const isRtl = dir.toLowerCase() === 'rtl';

      switch (event.key) {
        case 'ArrowRight': {
          event.preventDefault();
          const targetKey = isRtl ? prevKey : nextKey;
          buttonRefs.current[targetKey]?.focus();
          scheduleOpen(targetKey);
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          const targetKey = isRtl ? nextKey : prevKey;
          buttonRefs.current[targetKey]?.focus();
          scheduleOpen(targetKey);
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          setActiveCategory(key);
          requestAnimationFrame(() => focusFirstSubcategory(key));
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setActiveCategory(null);
          break;
        }
        default:
          break;
      }
    },
    [categoryKeys, focusFirstSubcategory, scheduleOpen]
  );

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <nav
      className={cn('relative hidden lg:block', className)}
      aria-label="Main navigation"
      onMouseLeave={scheduleClose}
    >
      <ul className="flex items-stretch gap-2">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.key;
          const panelId = `mega-menu-${category.key}`;
          return (
            <li key={category.key} className="relative">
              <button
                ref={(element) => {
                  buttonRefs.current[category.key] = element;
                }}
                type="button"
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150',
                  'hover:text-aqua-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive && 'text-aqua-500'
                )}
                aria-expanded={isActive}
                aria-controls={panelId}
                onMouseEnter={() => scheduleOpen(category.key)}
                onFocus={() => setActiveCategory(category.key)}
                onBlur={(event) => {
                  const target = event.relatedTarget as Node | null;
                  const panel = panelRefs.current[category.key];
                  if (
                    !event.currentTarget.contains(target) &&
                    !(panel && panel.contains(target))
                  ) {
                    scheduleClose();
                  }
                }}
                onKeyDown={(event) => handleCategoryKeyDown(event, category.key)}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground transition-colors duration-150 group-hover:bg-aqua-50 group-hover:text-aqua-600 dark:group-hover:bg-aqua-500/10 dark:group-hover:text-aqua-400">
                  <Icon name={category.icon} size="md" aria-hidden="true" />
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold leading-tight">
                    {tCategories(`${category.key}.title`)}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {tCategories(`${category.key}.titleEn`)}
                  </span>
                </div>
                <Icon
                  name="chevron-down"
                  size="sm"
                  aria-hidden="true"
                  className={cn(
                    'ms-auto text-muted-foreground transition-transform duration-200 motion-safe:transition-transform',
                    isActive ? 'rotate-180 text-aqua-500' : ''
                  )}
                  flipRtl
                />
              </button>
            </li>
          );
        })}
      </ul>

      {activeCategoryConfig && (
        <>
          <div
            className="fixed inset-0 z-40 hidden lg:block"
            onClick={() => setActiveCategory(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2">
            <div
              key={activeCategoryConfig.key}
              ref={(element) => {
                panelRefs.current[activeCategoryConfig.key] = element;
              }}
              onFocusCapture={() => clearTimers()}
              onBlurCapture={(event) => {
                const target = event.relatedTarget as Node | null;
                const panel = panelRefs.current[activeCategoryConfig.key];
                const button = buttonRefs.current[activeCategoryConfig.key];
                if (
                  !(panel && panel.contains(target)) &&
                  !(button && button.contains(target))
                ) {
                  scheduleClose();
                }
              }}
              id={`mega-menu-${activeCategoryConfig.key}`}
              role="region"
              aria-label={tCategories(`${activeCategoryConfig.key}.title`)}
              className={cn(
                'mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl ring-1 ring-border/60 backdrop-blur',
                'motion-safe:animate-fade-in motion-safe:transform motion-safe:transition-all motion-safe:duration-200'
              )}
              onMouseEnter={() => {
                clearTimers();
              }}
              onMouseLeave={scheduleClose}
            >
              <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_1.4fr] xl:grid-cols-[1fr_1.6fr]">
                <div className="relative overflow-hidden rounded-xl border border-border/70 bg-background">
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-80',
                      activeCategoryConfig.accent
                    )}
                    aria-hidden="true"
                  />
                  <Image
                    src={activeCategoryConfig.image}
                    alt={tCategories(`${activeCategoryConfig.key}.titleEn`)}
                    fill
                    sizes="320px"
                    className="object-cover object-center opacity-70"
                    loading="lazy"
                  />
                  <div className="relative flex h-full flex-col gap-4 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 text-foreground shadow-sm ring-1 ring-border/70">
                        <Icon name={activeCategoryConfig.icon} size="md" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-foreground">
                          {tCategories(`${activeCategoryConfig.key}.title`)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {tCategories(`${activeCategoryConfig.key}.titleEn`)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tCategories(`${activeCategoryConfig.key}.tagline`)}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                        className="shadow-md"
                        onClick={() => setActiveCategory(null)}
                      >
                        <Link
                          href={{
                            pathname: '/products',
                            query: { category: activeCategoryConfig.key },
                          }}
                        >
                          {tCategories('cta')}
                          <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
                        </Link>
                      </Button>
                      <span className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/70 backdrop-blur">
                        <Icon name="sparkles" size="sm" className="text-aqua-500" aria-hidden="true" />
                        {tCategories('bilingual')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeCategoryConfig.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory}
                      href={{
                        pathname: '/products',
                        query: { category: activeCategoryConfig.key, subcategory },
                      }}
                      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-muted/40 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-aqua-400 hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => setActiveCategory(null)}
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-background text-aqua-600 shadow-sm ring-1 ring-border/60">
                        <Icon name={activeCategoryConfig.icon} size="sm" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {tSubcategories(`${activeCategoryConfig.key}.${subcategory}`)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tCategories(`${activeCategoryConfig.key}.titleEn`)}
                        </span>
                      </div>
                      <Icon
                        name="arrow-right"
                        size="sm"
                        aria-hidden="true"
                        className="ms-auto text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-aqua-500"
                        flipRtl
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
