import { getTranslations } from 'next-intl/server';

export default async function SustainabilityPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'sustainability' });

  const pillars = [
    { title: t('pillars.habitatsTitle'), copy: t('pillars.habitatsCopy'), tone: 'from-sky-900/90 via-sky-700 to-sky-900/80' },
    { title: t('pillars.sourcingTitle'), copy: t('pillars.sourcingCopy'), tone: 'from-emerald-900/90 via-emerald-700 to-emerald-900/80' },
    { title: t('pillars.packagingTitle'), copy: t('pillars.packagingCopy'), tone: 'from-amber-900/80 via-amber-700 to-amber-900/70' },
  ];

  const actions = [
    t('actions.water'),
    t('actions.energy'),
    t('actions.plants'),
    t('actions.reuse'),
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-900 via-emerald-800 to-sky-950 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(46,204,113,0.18),transparent_40%)]" aria-hidden />
        <div className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t('title')}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t('heroTitle')}</h1>
          <p className="max-w-3xl text-base text-white/80">{t('heroSubtitle')}</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <span aria-hidden>🌿</span>
            <span>{t('donation')}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold">{t('pillars.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${pillar.tone} p-6 text-white shadow-lg`}
            >
              <div className="absolute inset-0 bg-black/10" aria-hidden />
              <div className="relative z-10 space-y-2">
                <h3 className="text-lg font-semibold">{pillar.title}</h3>
                <p className="text-sm text-white/85">{pillar.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">{t('actions.title')}</h2>
        <ul className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
          {actions.map((action) => (
            <li
              key={action}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
            >
              <span className="mt-1 text-lg" aria-hidden>🌱</span>
              <p className="leading-relaxed text-muted-foreground">{action}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
