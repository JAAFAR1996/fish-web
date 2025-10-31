import { useTranslations } from 'next-intl';

import { Icon, buttonVariants } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const INSTAGRAM_POSTS = [
  { id: '1', gradient: 'from-aqua-400 via-sky-500 to-blue-600' },
  { id: '2', gradient: 'from-emerald-400 via-green-500 to-teal-600' },
  { id: '3', gradient: 'from-coral-400 via-rose-500 to-pink-600' },
  { id: '4', gradient: 'from-sand-400 via-amber-500 to-yellow-600' },
  { id: '5', gradient: 'from-indigo-400 via-purple-500 to-fuchsia-600' },
  { id: '6', gradient: 'from-cyan-400 via-teal-500 to-emerald-600' },
] as const;

export function InstagramFeed() {
  const t = useTranslations('home.instagramFeed');

  return (
    <section
      aria-labelledby="instagram-feed-heading"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="text-center">
        <h2
          id="instagram-feed-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t('title')}
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {t('subtitle')}
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-aqua-500">
          {t('handle')}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {INSTAGRAM_POSTS.map(({ id, gradient }) => (
          <Link
            key={id}
            href="#"
            aria-label={`${t('viewOnInstagram')} ${id}`}
            className={cn(
              'instagram-card relative block aspect-square overflow-hidden rounded-2xl bg-gradient-to-br',
              gradient
            )}
          >
            <div className="instagram-overlay flex flex-col items-center justify-end p-4 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Icon name="instagram" size="md" aria-hidden="true" />
              </div>
              <span className="mt-3 text-xs uppercase tracking-wide text-white/80">
                {t('placeholder')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="#"
          className={cn(
            buttonVariants({ variant: 'primary', size: 'lg' }),
            'inline-flex items-center gap-2'
          )}
        >
          <Icon name="instagram" size="sm" />
          {t('followUs')}
        </Link>
      </div>
    </section>
  );
}

export default InstagramFeed;
