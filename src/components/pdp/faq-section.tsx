'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui';
import type { Product } from '@/types';

export interface FaqSectionProps {
  product: Product;
  className?: string;
}

export function FaqSection({ product: _product, className }: FaqSectionProps) {
  const t = useTranslations('pdp.faq');
  const questions = useMemo(
    () => ['q1', 'q2', 'q3', 'q4'],
    []
  );

  return (
    <div className={className}>
      <Accordion type="single" collapsible className="space-y-2">
        {questions.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{t(`${key}.question`)}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {t(`${key}.answer`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
