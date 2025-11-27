import { getTranslations } from 'next-intl/server';

import { FishFinderWizard } from '@/components/fish-finder/FishFinderWizard';
import { getProducts } from '@/lib/data/products';

type PageProps = {
  params: { locale: string };
};

export default async function FishFinderPage({ params }: PageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'fishFinder' });
  const products = await getProducts();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t('title')}
        </p>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <FishFinderWizard products={products} />
    </main>
  );
}
