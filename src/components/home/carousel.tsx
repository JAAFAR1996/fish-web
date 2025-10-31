'use client';

import {
  Children,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type Breakpoint = 'base' | 'sm' | 'md' | 'lg';
type ItemsPerViewConfig = Partial<Record<Breakpoint, number>>;

const BREAKPOINT_PREFIXES: Record<Breakpoint, string> = {
  base: '',
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
};

export interface CarouselProps {
  children: ReactNode;
  itemsPerView?: number | ItemsPerViewConfig;
  gap?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
}

function getDefaultItemsPerView(): Record<Breakpoint, number> {
  return {
    base: 1,
    sm: 1,
    md: 2,
    lg: 4,
  };
}

function resolveItemsPerView(
  value: CarouselProps['itemsPerView']
): Record<Breakpoint, number> {
  const defaults = getDefaultItemsPerView();

  if (typeof value === 'number') {
    return {
      base: value,
      sm: value,
      md: value,
      lg: value,
    };
  }

  if (!value) {
    return defaults;
  }

  return {
    base: value.base ?? defaults.base,
    sm: value.sm ?? defaults.sm,
    md: value.md ?? defaults.md,
    lg: value.lg ?? defaults.lg,
  };
}

function calculateWidthClasses(count: number): string[] {
  if (count <= 1) {
    return ['basis-full'];
  }

  const gaps = count - 1;
  const expression = `calc((100% - var(--carousel-gap) * ${gaps}) / ${count})`;
  return [`basis-[${expression}]`, `min-w-[${expression}]`];
}

function getActiveItemsPerView(
  config: Record<Breakpoint, number>
): number {
  if (typeof window === 'undefined') {
    return config.base;
  }

  const width = window.innerWidth;

  if (width >= 1024) {
    return config.lg;
  }

  if (width >= 768) {
    return config.md;
  }

  if (width >= 640) {
    return config.sm;
  }

  return config.base;
}

export function Carousel({
  children,
  itemsPerView,
  gap = 16,
  showNavigation = true,
  showDots = false,
  className,
  itemClassName,
  ariaLabel,
}: CarouselProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const containerRef = useRef<HTMLDivElement>(null);
  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const itemsConfig = useMemo(
    () => resolveItemsPerView(itemsPerView),
    [itemsPerView]
  );

  const [activeItemsPerView, setActiveItemsPerView] = useState(() =>
    getActiveItemsPerView(itemsConfig)
  );
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(childrenArray.length > activeItemsPerView);
  const [activePage, setActivePage] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const pageCount = Math.max(
    1,
    Math.ceil(childrenArray.length / Math.max(activeItemsPerView, 1))
  );

  const updateMotionPreference = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(query.matches);
  }, []);

  useEffect(() => {
    updateMotionPreference();
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => updateMotionPreference();
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, [updateMotionPreference]);

  const getNormalizedScroll = useCallback(
    (element: HTMLDivElement) => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      let normalized = element.scrollLeft;

      if (isRtl) {
        if (normalized < 0) {
          normalized = Math.abs(normalized);
        } else {
          normalized = maxScroll - normalized;
        }
      }

      return {
        current: normalized,
        maxScroll,
      };
    },
    [isRtl]
  );

  const scrollToNormalized = useCallback(
    (target: number) => {
      const container = containerRef.current;
      if (!container) return;

      const { maxScroll } = getNormalizedScroll(container);
      const clamped = Math.max(0, Math.min(target, maxScroll));

      let left = clamped;

      if (isRtl) {
        if (container.scrollLeft < 0) {
          left = -clamped;
        } else {
          left = maxScroll - clamped;
        }
      }

      container.scrollTo({
        left,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [getNormalizedScroll, isRtl, prefersReducedMotion]
  );

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { current, maxScroll } = getNormalizedScroll(container);
    const threshold = 1;

    setCanScrollPrevious(current > threshold);
    setCanScrollNext(current < maxScroll - threshold);

    const page = container.clientWidth
      ? Math.round(current / container.clientWidth)
      : 0;
    setActivePage((prev) => {
      const nextPage = Math.max(0, Math.min(pageCount - 1, page));
      return prev === nextPage ? prev : nextPage;
    });
  }, [getNormalizedScroll, pageCount]);

  useEffect(() => {
    const handleResize = () => {
      setActiveItemsPerView(getActiveItemsPerView(itemsConfig));
      requestAnimationFrame(updateScrollState);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsConfig, updateScrollState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    updateScrollState();
    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [childrenArray.length, updateScrollState]);

  const handleNext = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { current, maxScroll } = getNormalizedScroll(container);
    const target = Math.min(
      current + container.clientWidth,
      maxScroll
    );
    scrollToNormalized(target);
  }, [getNormalizedScroll, scrollToNormalized]);

  const handlePrevious = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { current } = getNormalizedScroll(container);
    const target = Math.max(current - container.clientWidth, 0);
    scrollToNormalized(target);
  }, [getNormalizedScroll, scrollToNormalized]);

  const handleDotClick = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const target = index * container.clientWidth;
      scrollToNormalized(target);
    },
    [scrollToNormalized]
  );

  const itemWidthClasses = useMemo(() => {
    const entries = Object.entries(itemsConfig) as Array<[Breakpoint, number]>;
    const classes: string[] = [];

    for (const [breakpoint, count] of entries) {
      const prefix = BREAKPOINT_PREFIXES[breakpoint];
      const widthClasses = calculateWidthClasses(count);

      widthClasses.forEach((widthClass) => {
        classes.push(prefix ? `${prefix}${widthClass}` : widthClass);
      });
    }

    return classes.join(' ');
  }, [itemsConfig]);

  const containerStyles: CSSProperties = {
    gap,
    ['--carousel-gap' as '--carousel-gap']: `${gap}px`,
  };

  return (
    <div className={cn('relative', className)}>
      {showNavigation && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex absolute top-1/2 start-0"
            onClick={handlePrevious}
            disabled={!canScrollPrevious}
            aria-label="Previous"
          >
            <Icon
              name="chevron-left"
              size="sm"
              flipRtl
            />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex absolute top-1/2 end-0"
            onClick={handleNext}
            disabled={!canScrollNext}
            aria-label="Next"
          >
            <Icon
              name="chevron-right"
              size="sm"
              flipRtl
            />
          </Button>
        </>
      )}

      <div
        ref={containerRef}
        className={cn(
          'scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto',
          showNavigation && 'sm:px-12'
        )}
        style={containerStyles}
        role="region"
        aria-label={ariaLabel ?? 'Carousel'}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className={cn(
              'snap-start',
              itemWidthClasses,
              'flex-shrink-0',
              itemClassName
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {showDots && pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'h-2.5 w-2.5 rounded-full bg-muted transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                index === activePage && 'w-6 bg-aqua-500'
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-pressed={index === activePage}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
