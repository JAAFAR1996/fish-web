import { getTranslations } from 'next-intl/server';

export default async function EcoFriendlyGuidePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'sustainability' });
  const sections = t.raw('guide.sections') as Record<
    string,
    { title: string; body: string }
  >;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="space-y-3 rounded-3xl border bg-gradient-to-br from-emerald-900/80 via-emerald-700/80 to-sky-900/70 p-8 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          {t('guide.title')}
        </p>
        <h1 className="text-3xl font-bold leading-tight">🌿 {t('guide.title')}</h1>
        <p className="max-w-3xl text-white/85">{t('guide.intro')}</p>
      </header>

      <article className="space-y-6 rounded-3xl border bg-background/80 p-6 shadow-sm">
        {Object.values(sections).map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </div>
        ))}

        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-100">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden>🌿</span>
            {t('ecoFriendly')}
          </p>
          <p className="mt-1 text-sm text-emerald-900/90 dark:text-emerald-100/80">
            {t('commitment')}
          </p>
        </div>
      </article>
    </main>
  );
}
