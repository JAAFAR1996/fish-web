import { getTranslations } from 'next-intl/server';

import { Badge, Icon } from '@/components/ui';
import { cn, generateSocialProofData } from '@/lib/utils';
import type { Product } from '@/types';

export interface SocialProofBadgeProps {
  product: Product;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export async function SocialProofBadge({
  product,
  variant = 'compact',
  className,
}: SocialProofBadgeProps) {
  const t = await getTranslations('pdp.socialProof');
  const socialProof = generateSocialProofData(product);

  const metrics = [
    {
      key: 'viewedToday',
      label: t('viewedToday', { count: socialProof.viewedToday }),
      icon: 'eye' as const,
      value: socialProof.viewedToday,
    },
    {
      key: 'boughtThisWeek',
      label: t('boughtThisWeek', { count: socialProof.boughtThisWeek }),
      icon: 'cart' as const,
      value: socialProof.boughtThisWeek,
    },
    {
      key: 'inCart',
      label: t('inCart', { count: socialProof.inCart }),
      icon: 'user' as const,
      value: socialProof.inCart,
    },
  ];

  const isTrending =
    socialProof.viewedToday > 120 || socialProof.boughtThisWeek > 15;

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'grid gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-3',
          className
        )}
      >
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="flex flex-col items-start gap-2 rounded-md bg-background/80 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name={metric.icon} size="sm" />
              <span className="text-xs uppercase tracking-wide">
                {metric.label}
              </span>
            </div>
            <span className="text-2xl font-semibold text-foreground">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
        className
      )}
    >
      {metrics.map((metric) => (
        <span
          key={metric.key}
          className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"
        >
          <Icon name={metric.icon} size="sm" />
          <span>{metric.label}</span>
        </span>
      ))}
      {isTrending && (
        <Badge variant="warning" className="flex items-center gap-1">
          <Icon name="activity" size="sm" />
          {t('trending')}
        </Badge>
      )}
    </div>
  );
}
