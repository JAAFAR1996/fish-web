import { useTranslations } from 'next-intl';

import { Icon, type IconName } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { NewsletterForm } from './NewsletterForm';

// Server Component
export function Footer() {
  const t = useTranslations('footer');

  const SHOP_LINKS: { key: string; href: string }[] = [
    { key: 'allProducts', href: '/products' },
    { key: 'filters', href: '/products/filters' },
    { key: 'heaters', href: '/products/heaters' },
    { key: 'lighting', href: '/products/plantLighting' },
    { key: 'waterCare', href: '/products/waterCare' },
    { key: 'plants', href: '/products/plantsFertilizers' },
  ];

  const SUPPORT_LINKS: { key: string; href: string }[] = [
    { key: 'contact', href: '#' },
    { key: 'shipping', href: '#' },
    { key: 'returns', href: '#' },
    { key: 'faq', href: '#' },
    { key: 'trackOrder', href: '#' },
    { key: 'sizeGuide', href: '#' },
  ];

  const ABOUT_LINKS: { key: string; href: string }[] = [
    { key: 'aboutUs', href: '#' },
    { key: 'blog', href: '/blog' },
    { key: 'gallery', href: '/gallery' },
    { key: 'careers', href: '#' },
    { key: 'privacy', href: '#' },
    { key: 'terms', href: '#' },
  ];

  const SOCIAL_LINKS: { name: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'whatsapp'; href: string; icon: IconName }[] = [
    { name: 'facebook', href: '#', icon: 'facebook' },
    { name: 'instagram', href: '#', icon: 'instagram' },
    { name: 'twitter', href: '#', icon: 'twitter' },
    { name: 'youtube', href: '#', icon: 'youtube' },
    { name: 'whatsapp', href: '#', icon: 'whatsapp' },
  ];
  // TODO: Add actual social media URLs

  const TRUST_BADGES: { key: 'cod' | 'returns' | 'delivery' | 'support'; icon: 'credit-card' | 'package' | 'truck' | 'help' }[] = [
    { key: 'cod', icon: 'credit-card' },
    { key: 'returns', icon: 'package' },
    { key: 'delivery', icon: 'truck' },
    { key: 'support', icon: 'help' },
  ];

  return (
    <footer role="contentinfo" className="border-t border-border bg-muted">
      {/* Newsletter Section */}
      <section className="bg-aqua-500/10">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            {t('newsletterTitle')}
          </h2>
          <p className="mb-6 text-center text-muted-foreground">
            {t('newsletterDescription')}
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Main Footer Content */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Shop */}
            <nav aria-label={t('shop')}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('shop')}
              </h2>
              <ul className="space-y-2">
                {SHOP_LINKS.map(({ key, href }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-aqua-500"
                    >
                      {t(`shopLinks.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Support */}
            <nav aria-label={t('support')}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('support')}
              </h2>
              <ul className="space-y-2">
                {SUPPORT_LINKS.map(({ key, href }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-aqua-500"
                    >
                      {t(`supportLinks.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* About */}
            <nav aria-label={t('about')}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('about')}
              </h2>
              <ul className="space-y-2">
                {ABOUT_LINKS.map(({ key, href }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-aqua-500"
                    >
                      {t(`aboutLinks.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Social */}
            <section aria-label={t('followUs')}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('followUs')}
              </h2>
              <div className="flex items-center gap-4">
                {SOCIAL_LINKS.map(({ name, href, icon }) => (
                  <Link
                    key={name}
                    href={href}
                    aria-label={t(`socialMedia.${name}`)}
                    className="text-foreground transition-colors hover:text-aqua-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  >
                    <Icon name={icon} size="md" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Trust Badges */}
          <section className="mt-12 border-t border-border pt-8" aria-label={t('trustBadgesTitle')}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_BADGES.map(({ key, icon }) => (
                <div key={key} className="flex items-start gap-3">
                  <Icon name={icon} size="lg" className="text-aqua-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t(`trustBadges.${key}.title`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`trustBadges.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom */}
          <section className="mt-8 border-t border-border pt-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t('copyright', { year: new Date().getFullYear() })}
              </p>
              <div className="text-sm text-muted-foreground">
                {t('paymentMethods')}
                {/* TODO: Add payment method icons */}
              </div>
            </div>
          </section>
        </div>
      </section>
    </footer>
  );
}

export default Footer;
