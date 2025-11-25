'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Button, Icon } from '@/components/ui';
import { useCart } from '@/components/providers/CartProvider';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  key: 'home' | 'categories' | 'search' | 'cart';
  href: string;
  icon: Parameters<typeof Icon>[0]['name'];
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/', icon: 'home' },
  { key: 'categories', href: '/products', icon: 'grid' },
  { key: 'search', href: '/search', icon: 'search' },
  { key: 'cart', href: '/cart', icon: 'cart' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav.mobile');
  const { itemCount } = useCart();

  const resolvedPath = useMemo(() => pathname ?? '/', [pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('label')}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const target = item.href === '/' ? `/${locale}` : `/${locale}${item.href}`;
          const isActive =
            resolvedPath === target ||
            resolvedPath === `${target}/` ||
            resolvedPath === item.href ||
            resolvedPath.startsWith(`${target}/`);

          return (
            <Button
              key={item.key}
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                'flex-1 rounded-2xl py-2',
                isActive && 'bg-aqua-500/10 text-aqua-700 dark:text-aqua-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Link href={item.href} className="flex flex-col items-center gap-1">
                <span className="relative inline-flex h-6 w-6 items-center justify-center">
                  <Icon
                    name={item.icon}
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                  {item.key === 'cart' && itemCount > 0 && (
                    <span className="absolute -top-1 -end-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-aqua-500 px-1 text-[11px] font-semibold text-white shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium leading-none">
                  {t(item.key)}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
