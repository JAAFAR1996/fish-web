'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  DarkModeToggle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from '@/components/ui';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { NotificationCenter } from '@/components/notifications';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  RETURN_POLICY_WINDOW_DAYS,
  SUPPORT_ADDRESS,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from '@/lib/config/contact';
import { EasterEggs } from '@/components/effects/EasterEggs';
import { BubbleTrailToggle } from '@/components/effects/BubbleTrailToggle';

import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';

export const Header = () => {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tLoyalty = useTranslations('marketing.loyalty');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, signOut } = useAuth();
  const { itemCount, openSidebar } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email || '';
  const userInitials = userDisplayName
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const loyaltyBalance = user?.loyaltyPointsBalance ?? 0;
  const cashOnDelivery = locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery';
  const returnPolicy = locale === 'ar'
    ? `إرجاع أو استبدال خلال ${RETURN_POLICY_WINDOW_DAYS} أيام`
    : `Easy returns within ${RETURN_POLICY_WINDOW_DAYS} days`;
  const addressLabel = locale === 'ar' ? SUPPORT_ADDRESS : 'Baghdad – Iraq';

  return (
    <>
      <div className="flex flex-col gap-2 bg-aqua-600 px-4 py-2 text-xs font-medium text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-sm lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <Icon name="credit-card" className="h-4 w-4" aria-hidden />
            <span>{cashOnDelivery}</span>
          </span>
          <Link
            href="/return-policy"
            className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
          >
            <Icon name="package" className="h-4 w-4" aria-hidden />
            <span>{returnPolicy}</span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`tel:+${SUPPORT_PHONE_E164}`}
            className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
            dir="ltr"
          >
            <Icon name="phone" className="h-4 w-4" aria-hidden />
            {SUPPORT_PHONE_DISPLAY}
          </a>
          <span className="inline-flex items-center gap-2">
            <Icon name="home" className="h-4 w-4" aria-hidden />
            <span>{addressLabel}</span>
          </span>
        </div>
      </div>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-transparent transition-all duration-200',
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-border shadow-sm'
            : 'bg-background/80'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 lg:hidden"
              aria-label={t('menu')}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Icon name="menu" size="md" aria-hidden="true" />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <EasterEggs logoRef={logoRef} secretKeyword="aqua" />
              {/* TODO: Replace with actual logo image */}
              <div
                ref={logoRef}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua-500 text-sm font-semibold text-white"
              >
                FW
              </div>
              <span className="text-xl font-bold text-foreground">
                FISH WEB
              </span>
            </Link>
          </div>

          <div className="flex flex-1 items-center gap-6">
            <SearchBar className="hidden sm:flex max-w-2xl flex-1 rounded-full border border-aqua-100 bg-white/60 shadow-sm backdrop-blur sm:px-2" />
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <span className="inline-flex items-center gap-2 rounded-full bg-aqua-500/10 px-3 py-1 text-xs font-semibold text-aqua-700 dark:text-aqua-200">
                <Icon name="sparkles" className="h-4 w-4" aria-hidden="true" />
                {tLoyalty('pointsShort', { points: loyaltyBalance })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/calculators">{t('calculators')}</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/search">
                <Icon name="search" size="sm" className="me-2" />
                {locale === 'ar' ? 'البحث' : 'Search'}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/about">{locale === 'ar' ? 'من نحن' : 'About'}</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/support">{locale === 'ar' ? 'الدعم' : 'Support'}</Link>
            </Button>
            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" aria-hidden="true" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-2 py-1"
                    aria-label={t('account')}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua-500 text-sm font-semibold text-white">
                      {userInitials || 'U'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {userDisplayName}
                    </span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">{t('account')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=orders">{t('orders')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=wishlist">{t('wishlist')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=settings">{t('settings')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      signOut();
                    }}
                  >
                    <Icon name="logout" size="sm" className="me-2" />
                    {tAuth('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 sm:hidden"
                  aria-label={tAuth('modal.title')}
                  asChild
                >
                  <Link href="/auth">
                    <Icon name="user" size="md" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  asChild
                >
                  <Link href="/auth">
                    <Icon name="user" size="sm" className="me-2" />
                    {tAuth('modal.title')}
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="relative rounded-full p-2"
              aria-label={t('cart')}
              onClick={() => openSidebar()}
              data-cart-target
            >
              <Icon name="cart" size="md" aria-hidden="true" />
              {itemCount > 0 ? (
                <Badge
                  variant="primary"
                  size="sm"
                  className="absolute -top-1 -end-1 animate-badge-bounce"
                  aria-label={`${itemCount} items in cart`}
                >
                  {itemCount}
                </Badge>
              ) : null}
            </Button>
            {user && <NotificationCenter />}
            <DarkModeToggle size="sm" />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Switch theme">
                  <Icon name="sparkles" size="sm" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 space-y-3">
                <ThemeSwitcher />
                <BubbleTrailToggle />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="block border-t border-border/60 px-4 pb-3 pt-2 sm:hidden">
          <SearchBar size="sm" className="w-full" />
        </div>
        <div className="hidden border-t border-border/70 px-4 py-2 lg:block">
          <MegaMenu />
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};

export default Header;
