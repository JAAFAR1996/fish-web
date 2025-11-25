import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Icon, Input, Button } from '@/components/ui';

type NotFoundProps = {
  params: { locale: string };
};

export default async function NotFound({ params }: NotFoundProps) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations('notFound');

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aqua-500/10 text-aqua-600">
        <Icon name="search" className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        {t('title')}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {t('description')}
      </p>

      <form
        action={`/${locale}/search`}
        method="get"
        className="mt-6 flex w-full max-w-xl items-center gap-2"
        role="search"
        aria-label={t('searchLabel')}
      >
        <Input
          name="q"
          type="search"
          aria-label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          <Icon name="search" className="me-2 h-4 w-4" aria-hidden />
          {t('searchCta')}
        </Button>
      </form>

      <div className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 rounded-lg border border-border/70 bg-card p-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Icon name="home" className="h-5 w-5 text-aqua-600" aria-hidden />
          {t('ctaHome')}
        </Link>
        <Link
          href="/products"
          className="flex flex-col items-center gap-2 rounded-lg border border-border/70 bg-card p-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Icon name="grid" className="h-5 w-5 text-aqua-600" aria-hidden />
          {t('ctaProducts')}
        </Link>
        <Link
          href="/search"
          className="flex flex-col items-center gap-2 rounded-lg border border-border/70 bg-card p-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Icon name="help" className="h-5 w-5 text-aqua-600" aria-hidden />
          {t('ctaSupport')}
        </Link>
      </div>

      <div className="mt-10 w-full max-w-3xl rounded-lg border border-border/70 bg-muted/40 p-4 text-start">
        <h2 className="text-base font-semibold text-foreground">
          {t('popularTitle')}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-aqua-700 dark:text-aqua-200 sm:grid-cols-2">
          <li>
            <Link href="/products?category=filters" className="hover:underline">
              {t('popularFilters')}
            </Link>
          </li>
          <li>
            <Link href="/products?category=heaters" className="hover:underline">
              {t('popularHeaters')}
            </Link>
          </li>
          <li>
            <Link href="/products?category=waterCare" className="hover:underline">
              {t('popularWaterCare')}
            </Link>
          </li>
          <li>
            <Link href="/products?category=plantLighting" className="hover:underline">
              {t('popularLighting')}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
