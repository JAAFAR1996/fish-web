import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { GalleryDetailView } from '@/components/gallery';
import { getSetupById } from '@/lib/gallery/gallery-queries';
import { incrementViewCountAction } from '@/lib/gallery/gallery-actions';
import { getProducts } from '@/lib/data/products';
import type { GallerySetup, GallerySetupWithProducts, Hotspot, Locale } from '@/types';

export const dynamic = 'force-dynamic';
const BASE_URL = 'https://fishweb.iq';

export async function generateMetadata({ params }: { params: { locale: Locale; id: string } }): Promise<Metadata> {
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  const setup = await getSetupById(id);
  const supabase = await (await import('@/lib/supabase/server')).createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id;
  if (!setup || (!setup.is_approved && setup.user_id !== currentUserId)) {
    return { title: t('pageTitle'), description: t('description') };
  }
  let primaryMedia: string | undefined;
  if (Array.isArray(setup.media_urls) && setup.media_urls.length > 0) {
    const firstMedia = setup.media_urls[0];
    if (typeof firstMedia === 'string') {
      primaryMedia = firstMedia;
    } else if (firstMedia) {
      primaryMedia = firstMedia.url;
    }
  }
  const absoluteMedia = primaryMedia
    ? (primaryMedia.startsWith('http') ? primaryMedia : `${BASE_URL}${primaryMedia}`)
    : undefined;

  return {
    title: `${setup.title} | ${t('pageTitle')}`,
    description: setup.description ?? undefined,
    openGraph: {
      title: setup.title,
      description: setup.description ?? undefined,
      type: 'article',
      images: absoluteMedia
        ? [
            {
              url: absoluteMedia,
              width: 1200,
              height: 630,
              alt: setup.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: setup.title,
      description: setup.description ?? undefined,
      images: absoluteMedia ? [absoluteMedia] : undefined,
    },
  };
}

export default async function GalleryDetailPage({ params }: { params: { locale: Locale; id: string } }) {
  const { locale, id } = params;
  setRequestLocale(locale);

  const setupRow = await getSetupById(id);
  const supabase = await (await import('@/lib/supabase/server')).createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id;
  if (!setupRow || (!setupRow.is_approved && setupRow.user_id !== currentUserId)) {
    notFound();
  }

  const allProducts = await getProducts();
  const productIds = Array.from(new Set((setupRow.hotspots ?? []).map((h: Hotspot) => h.product_id).filter(Boolean)));
  const products = allProducts.filter((p) => productIds.includes(p.id));

  const setup: GallerySetupWithProducts = { ...setupRow, products };

  // Fire and forget increment
  incrementViewCountAction(id);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <GalleryDetailView setup={setup} locale={locale} />
    </div>
  );
}
