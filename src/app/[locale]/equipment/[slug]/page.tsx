import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { TechnicalIcons } from '@/components/equipment/TechnicalIcons';
import { ExplodedView } from '@/components/equipment/ExplodedView';
import { ARViewer } from '@/components/products/ARViewer';
import { ProductVideo } from '@/components/products/ProductVideo';
import { getProductBySlug } from '@/lib/data/products';
import { formatCurrency } from '@/lib/utils';
import type { Locale } from '@/types';

type PageProps = {
  params: { locale: string; slug: string };
};

export default async function EquipmentPage({ params }: PageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'product' });
  const product = await getProductBySlug(params.slug);
  const formatLocale = params.locale as Locale;

  if (!product) {
    return notFound();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <header className="grid gap-8 rounded-3xl border border-border/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-2xl lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Terminal Industries</p>
          <h1 className="text-4xl font-bold">{product.name}</h1>
          <p className="text-white/80">{product.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SpecBlock label="Flow" value={`${product.specifications.flow ?? 0} L/H`} />
            <SpecBlock label="Power" value={`${product.specifications.power ?? 0} W`} />
            <SpecBlock
              label="Tank"
              value={product.specifications.compatibility.displayText ?? t('specs.compatibility')}
            />
            <SpecBlock label="Price" value={formatCurrency(product.price, formatLocale)} />
          </div>
          <div className="flex flex-wrap gap-3">
            {product.images?.[0] && <ARViewer modelUrl={product.images[0]} />}
            <ProductVideo src="/videos/product-demo.mp4" className="w-full max-w-md" />
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(0,217,255,0.1),transparent_35%)]" />
          <div className="relative z-10 h-full w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.thumbnail || product.images?.[0]}
              alt={product.name}
              className="h-full w-full object-contain mix-blend-screen"
            />
          </div>
        </div>
      </header>

      <TechnicalIcons className="mt-4" />

      {product.explodedViewParts?.length ? (
        <ExplodedView parts={product.explodedViewParts} className="mt-6" image={product.images?.[1]} />
      ) : null}

      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          Engineered with precision-cut chambers and optimized flow paths to maximize contact time and reduce turbulence noise.
        </p>
      </section>
    </main>
  );
}

function SpecBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-4 text-white shadow-inner">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
