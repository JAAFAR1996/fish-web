'use client';

import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const GUIDES = ['filterGuide', 'heaterGuide', 'waterGuide'] as const;

const GUIDE_ICONS: Record<(typeof GUIDES)[number], Parameters<typeof Icon>[0]['name']> = {
  filterGuide: 'filter',
  heaterGuide: 'thermometer',
  waterGuide: 'droplet',
};

export function QuickGuides() {
  const t = useTranslations('home.quickGuides');

  return (
    <section
      aria-labelledby="quick-guides-heading"
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mb-8 text-center">
        <h2
          id="quick-guides-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t('title')}
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {t('subtitle')}
        </p>
      </div>

      <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-background/90 shadow-sm">
        {GUIDES.map((key) => (
          <AccordionItem
            key={key}
            value={key}
            className="border-b border-border/40 last:border-b-0"
          >
            <AccordionTrigger className="flex w-full items-center gap-3 px-6 py-4 text-start text-lg font-semibold">
              <span className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full bg-aqua-500/10 text-aqua-600 dark:bg-aqua-400/10 dark:text-aqua-300'
              )}>
                <Icon name={GUIDE_ICONS[key]} size="sm" aria-hidden="true" />
              </span>
              <span>{t(`${key}.title`)}</span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-5 pt-0 text-sm leading-relaxed text-muted-foreground">
              {t(`${key}.content`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default QuickGuides;

