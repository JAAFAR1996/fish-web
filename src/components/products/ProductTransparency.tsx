'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { Product } from '@/types';
import { useTranslations } from 'next-intl';

type ProductTransparencyProps = {
  product: Product;
};

export function ProductTransparency({ product }: ProductTransparencyProps) {
  const t = useTranslations('product');
  const tTransparency = useTranslations('product.transparency');

  const details: Array<{ key: string; label: string; value: string; accent?: boolean }> = [
    {
      key: 'origin',
      label: tTransparency('origin'),
      value: product.brand || tTransparency('notSpecified'),
    },
    {
      key: 'materials',
      label: tTransparency('materials'),
      value:
        product.explodedViewParts?.length && product.explodedViewParts.length > 0
          ? tTransparency('partsDocumented', { count: product.explodedViewParts.length })
          : tTransparency('materialsUnknown'),
    },
    {
      key: 'energy',
      label: tTransparency('energy'),
      value:
        product.specifications.power != null
          ? tTransparency('energyValue', { value: product.specifications.power })
          : tTransparency('notSpecified'),
    },
    {
      key: 'lifecycle',
      label: tTransparency('lifecycle'),
      value: tTransparency('notSpecified'),
    },
    {
      key: 'certifications',
      label: tTransparency('certifications'),
      value: product.ecoFriendly ? tTransparency('ecoBadge') : tTransparency('notSpecified'),
      accent: Boolean(product.ecoFriendly),
    },
  ];

  return (
    <Card className="space-y-4 border bg-background/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t('labels.ecoFriendly')}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{tTransparency('title')}</h3>
        </div>
        {product.ecoFriendly && (
          <Badge variant="success" className="flex items-center gap-1 text-xs">
            <span aria-hidden>🌿</span>
            {tTransparency('ecoBadge')}
          </Badge>
        )}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {details.map((item) => (
          <li
            key={item.key}
            className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground"
          >
            <Icon name="help" className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className={item.accent ? 'text-emerald-600 font-semibold' : 'text-foreground'}>
                {item.value}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
