import { useTranslations } from 'next-intl';

import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Icon,
  buttonVariants,
} from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const CALCULATORS = [
  {
    key: 'heater',
    icon: 'thermometer',
    href: { pathname: '/calculators', query: { tab: 'heater' } } as const,
    accent: 'from-aqua-100 to-aqua-200 dark:from-aqua-900 dark:to-aqua-800',
    comingSoon: false,
  },
  {
    key: 'filter',
    icon: 'filter',
    href: { pathname: '/calculators', query: { tab: 'filter' } } as const,
    accent: 'from-coral-100 to-coral-200 dark:from-coral-900 dark:to-coral-800',
    comingSoon: false,
  },
  {
    key: 'salinity',
    icon: 'droplet',
    href: { pathname: '/calculators', query: { tab: 'salinity' } } as const,
    accent: 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
    comingSoon: true,
  },
] as const;

export function CalculatorsShowcase() {
  const t = useTranslations('home.calculatorsShowcase');
  const tSalinity = useTranslations('calculators.salinity');

  return (
    <section
      aria-labelledby="calculators-showcase-heading"
      className="mx-auto max-w-7xl rounded-3xl bg-muted/60 px-4 py-14 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="calculators-showcase-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t('title')}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t('subtitle')}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {CALCULATORS.map(({ key, icon, href, accent, comingSoon }) => {
          const card = (
            <Card
              hoverable={!comingSoon}
              className={cn(
                'h-full border border-border/60 bg-background/90 shadow-lg shadow-aqua-900/5 transition-transform',
                comingSoon
                  ? 'opacity-95'
                  : 'motion-safe:group-hover:-translate-y-1'
              )}
            >
              <CardHeader className="items-center text-center">
                <span
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br shadow-md shadow-black/10 transition-transform',
                    accent,
                    !comingSoon && 'motion-safe:group-hover:-translate-y-1'
                  )}
                >
                  <Icon name={icon} size="lg" className="text-primary" aria-hidden="true" />
                </span>
                <CardTitle className="mt-4 text-xl font-semibold text-foreground">
                  {t(`${key}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col items-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {t(`${key}.description`)}
                </p>
                {comingSoon && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {tSalinity('comingSoon')}
                  </Badge>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex flex-col gap-3">
                <span
                  className={cn(
                    buttonVariants({
                      variant: comingSoon ? 'outline' : 'primary',
                      size: 'lg',
                    }),
                    'w-full justify-center transition-opacity',
                    comingSoon && 'cursor-not-allowed opacity-70'
                  )}
                  aria-disabled={comingSoon || undefined}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {comingSoon ? tSalinity('comingSoon') : t('tryNow')}
                    {!comingSoon && <Icon name="arrow-right" size="sm" flipRtl />}
                  </span>
                </span>
              </CardFooter>
            </Card>
          );

          if (comingSoon) {
            return (
              <div
                key={key}
                role="group"
                aria-disabled="true"
                tabIndex={-1}
                className="group block cursor-not-allowed select-none"
              >
                {card}
              </div>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {card}
            </Link>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/calculators"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'inline-flex items-center gap-2'
          )}
        >
          <Icon name="calculator" size="sm" />
          {t('viewAll')}
        </Link>
      </div>
    </section>
  );
}

export default CalculatorsShowcase;
