import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { GalleryGrid } from '@/components/gallery';
import { getFeaturedSetups, getGallerySetups } from '@/lib/gallery/gallery-queries';
import type { GalleryFilters as Filters, GalleryStyle, Locale, TankSizeRange } from '@/types';
import { GalleryFiltersClient } from '@/components/gallery/GalleryFiltersClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'gallery' });
  return { title: t('pageTitle'), description: t('description'), robots: { index: true, follow: true } };
}

export default async function GalleryPage({ params, searchParams }: { params: { locale: Locale }; searchParams: Record<string, string | string[] | undefined> }) {
  const { locale } = params;
  setRequestLocale(locale);

  const rawStyle = typeof searchParams.style === 'string' ? searchParams.style.split(',')[0] : undefined;
  const style = rawStyle as GalleryStyle | undefined;

  const rawTank = typeof searchParams.tankSize === 'string' ? searchParams.tankSize : 'all';
  const tankSizeRange: TankSizeRange | 'all' = ['nano', 'small', 'medium', 'large', 'all'].includes(rawTank)
    ? (rawTank as TankSizeRange | 'all')
    : 'all';

  const [featured, setups] = await Promise.all([
    getFeaturedSetups(6),
    getGallerySetups({ isApproved: true, style, tankSizeRange }),
  ]);

  const filters: Filters = { tankSizeRange, styles: style ? [style] : [], searchQuery: '', sortBy: 'newest' };

  const t = await getTranslations({ locale, namespace: 'gallery' });
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{t('pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('pageSubtitle')}</p>
      </div>

      {featured.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t('featured')}</h2>
          <GalleryGrid setups={featured} locale={locale} />
        </section>
      )}

      <GalleryFiltersClient initialFilters={filters} />

      <div className="mt-6">
        <GalleryGrid setups={setups} locale={locale} />
      </div>
    </div>
  );
}
