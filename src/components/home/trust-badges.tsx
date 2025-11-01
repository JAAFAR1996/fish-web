import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

const TRUST_BADGES = [
  { key: 'cod', icon: 'credit-card' },
  { key: 'returns', icon: 'package' },
  { key: 'delivery', icon: 'truck' },
  { key: 'support', icon: 'help' },
] as const;

export function TrustBadges() {
  const tHome = useTranslations('home.trustBadges');
  const tFooter = useTranslations('footer.trustBadges');

  return (
    <section
      aria-labelledby="trust-badges-heading"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-aqua-50 via-white to-sand-50 p-10 shadow-lg dark:from-aqua-950/40 dark:via-background dark:to-sand-950/40">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="trust-badges-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {tHome('title')}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {tHome('subtitle')}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map(({ key, icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-4 rounded-2xl bg-background/80 p-6 text-center shadow-sm transition-transform motion-safe:hover:-translate-y-1"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-aqua-500 via-aqua-600 to-aqua-700 text-white shadow-lg dark:from-aqua-400 dark:via-aqua-500 dark:to-aqua-600">
                <Icon name={icon} size="lg" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {tFooter(`${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tFooter(`${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustBadges;

