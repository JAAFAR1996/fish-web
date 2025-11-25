'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';
import { FreeShippingProgress } from './free-shipping-progress';
import { EmptyCart } from './empty-cart';
import { CalculatorLink } from './calculator-link';

const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SidebarCart() {
  const {
    items,
    savedItems,
    itemCount,
    subtotal,
    shipping,
    total,
    isSidebarOpen,
    isLoading,
    closeSidebar,
    removeItem,
    updateQuantity,
    saveForLater,
  } = useCart();
  const t = useTranslations('cart');
  const tLoyalty = useTranslations('marketing.loyalty');
  const locale = useLocale();
  const isRtl = useMemo(() => locale === 'ar', [locale]);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const loyaltyBalance = user?.loyaltyPointsBalance ?? 0;

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const trapFocus = useCallback((event: KeyboardEvent) => {
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
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
        return;
      }

      trapFocus(event);
    },
    [closeSidebar, trapFocus]
  );

  useEffect(() => {
    if (!isSidebarOpen) {
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
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
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
  }, [handleKeyDown, isSidebarOpen]);

  if (!isSidebarOpen) {
    return null;
  }

  const panelAnimationClass = isRtl
    ? 'motion-safe:animate-slide-in-left'
    : 'motion-safe:animate-slide-in-right';
  const baseTranslate = isRtl ? '-translate-x-full' : 'translate-x-full';

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm motion-safe:animate-fade-in"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('yourCart')}
        tabIndex={-1}
        className={cn(
          'fixed top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl outline-none',
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:transform-gpu',
          isRtl ? 'start-0' : 'end-0',
          baseTranslate,
          panelAnimationClass,
          isVisible && 'translate-x-0'
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t('yourCart')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {itemCount === 1
                ? t('itemsCountSingular')
                : t('itemsCount', { count: itemCount })}
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="sm"
            aria-label={t('actions.closeCart')}
            onClick={closeSidebar}
            className="rounded-full p-2"
        >
            <Icon name="close" size="sm" aria-hidden="true" />
          </Button>
        </header>

        {user && (
          <div className="mx-4 mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground">
            <span className="inline-flex items-center gap-2">
              <Icon name="sparkles" className="h-4 w-4 text-aqua-600" aria-hidden />
              {t('loyaltyBalanceLabel')}
            </span>
            <span>{tLoyalty('pointsShort', { points: loyaltyBalance })}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <FreeShippingProgress subtotal={subtotal} variant="compact" />
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-lg border border-border/50 bg-muted/40"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyCart
                variant="sidebar"
                savedItemsCount={savedItems.length}
              />
            ) : (
              items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                  onSaveForLater={saveForLater}
                  variant="sidebar"
                />
              ))
            )}
          </div>
          {!isLoading && items.length > 0 && (
            <div className="mt-4">
              <CalculatorLink cartItems={items} variant="link" />
            </div>
          )}
        </div>

        <footer className="border-t border-border px-4 py-3">
          <CartSummary
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            itemCount={itemCount}
            variant="sidebar"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full" asChild>
            <Link href="/cart" onClick={closeSidebar}>{t('actions.viewCart')}</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}

