import '@/app/globals.css';

import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { headers as nextHeaders } from 'next/headers';

import { Header, Footer } from '@/components/layout';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { WishlistProvider } from '@/components/providers/WishlistProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { routing } from '@/i18n/routing';
import { getDirection } from '@/lib/utils';
import { getUser } from '@/lib/auth/utils';
import PlausibleAnalytics from '@/components/analytics/plausible-analytics';
import type { NextWebVitalsMetric } from 'next/app';
import { reportWebVitals as reportWebVitalsToAnalytics } from '@/lib/analytics/web-vitals';

type Locale = (typeof routing.locales)[number];
type Params = { locale: string };

type RootLayoutProps = {
  children: ReactNode;
  params: Params;
};

function ensureLocale(locale: string): Locale {
  if (routing.locales.includes(locale as Locale)) {
    return locale as Locale;
  }

  notFound();
}

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const OfflineIndicator = dynamic(
  () =>
    import('@/components/pwa/offline-indicator').then(
      (mod) => mod.OfflineIndicator
    ),
  { ssr: false }
);

const InstallPrompt = dynamic(
  () =>
    import('@/components/pwa/install-prompt').then(
      (mod) => mod.InstallPrompt
    ),
  { ssr: false }
);

const UpdatePrompt = dynamic(
  () =>
    import('@/components/pwa/update-prompt').then(
      (mod) => mod.UpdatePrompt
    ),
  { ssr: false }
);

const BASE_URL = 'https://fishweb.iq';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const locale = ensureLocale(params.locale);

  const titles: Record<Locale, string> = {
    ar: 'متجر الأكواريوم المميز',
    en: 'Premium Aquarium Equipment Store',
  };

  const descriptions: Record<Locale, string> = {
    ar: 'أفضل معدات الأحواض المائية في العراق مع دعم كامل للغتين العربية والإنجليزية.',
    en: 'Shop premium aquarium equipment in Iraq with full Arabic and English support.',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    metadataBase: new URL(BASE_URL),
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/icons/icon-192x192.png', type: 'image/png' },
        { url: '/icons/icon-512x512.png', type: 'image/png' },
      ],
      apple: '/icons/icon-152x152.png',
      shortcut: [
        { url: '/icons/icon-96x96.png', type: 'image/png' },
        { url: '/icons/icon-128x128.png', type: 'image/png' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/icons/icon-maskable-512x512.png',
          color: '#0E8FA8',
        },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: titles[locale],
    },
    alternates: {
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
  };
}

export function generateViewport() {
  return {
    themeColor: '#0E8FA8',
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const locale = ensureLocale(params.locale);
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = getDirection(locale);
  const user = await getUser();
  const headerList = nextHeaders();
  const cspNonce = headerList.get('x-csp-nonce') ?? undefined;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased transition-colors duration-300">
        <SupabaseAuthProvider>
          <NotificationProvider userId={user?.id}>
            <CartProvider>
              <WishlistProvider>
                <ThemeProvider>
                  <NextIntlClientProvider messages={messages}>
                    <Header />
                    <OfflineIndicator />
                    <InstallPrompt />
                    <UpdatePrompt />
                    <main id="main-content" className="flex-1 pt-16">
                      {children}
                    </main>
                    <Footer />
                  </NextIntlClientProvider>
                </ThemeProvider>
              </WishlistProvider>
            </CartProvider>
          </NotificationProvider>
        </SupabaseAuthProvider>
        {process.env.NODE_ENV === 'production' && <PlausibleAnalytics nonce={cspNonce} />}
      </body>
    </html>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportWebVitalsToAnalytics(metric);
}
