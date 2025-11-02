'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui';
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
                  'flex flex-col items-start gap-1 rounded-md px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150',
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
                <span className="text-base">
                  {tCategories(`${category.key}.title`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tCategories(`${category.key}.titleEn`)}
                </span>
                <Icon
                  name="chevron-down"
                  size="sm"
                  aria-hidden="true"
                  className={cn(
                    'absolute end-2 top-1/2 -translate-y-1/2 transition-transform duration-200 motion-safe:transition-transform',
                    isActive ? 'rotate-180' : ''
                  )}
                  flipRtl
                />
              </button>
            </li>
          );
        })}
      </ul>

      {activeCategory && (
        <>
          <div
            className="fixed inset-0 z-40 hidden lg:block"
            onClick={() => setActiveCategory(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2">
            {CATEGORIES.filter((category) => category.key === activeCategory).map(
              (category) => (
                <div
                  key={category.key}
                  ref={(element) => {
                    panelRefs.current[category.key] = element;
                  }}
                  onFocusCapture={() => clearTimers()}
                  onBlurCapture={(event) => {
                    const target = event.relatedTarget as Node | null;
                    const panel = panelRefs.current[category.key];
                    const button = buttonRefs.current[category.key];
                    if (
                      !(panel && panel.contains(target)) &&
                      !(button && button.contains(target))
                    ) {
                      scheduleClose();
                    }
                  }}
                  id={`mega-menu-${category.key}`}
                  role="region"
                  aria-label={tCategories(`${category.key}.title`)}
                  className={cn(
                    'mx-auto w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-background shadow-xl',
                    'motion-safe:animate-fade-in motion-safe:transform motion-safe:transition-all motion-safe:duration-200'
                  )}
                  onMouseEnter={() => {
                    clearTimers();
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory}
                        href={`/products/${category.key}/${subcategory}`}
                        className="group flex flex-col gap-1 rounded-md p-3 transition-colors duration-150 hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={() => setActiveCategory(null)}
                      >
                        <span className="text-sm font-semibold text-foreground transition-colors duration-150 group-hover:text-aqua-500">
                          {tSubcategories(`${category.key}.${subcategory}`)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}
    </nav>
  );
}
