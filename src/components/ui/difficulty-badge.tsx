'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { DifficultyLevel } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type DifficultyBadgeProps = {
  level: DifficultyLevel;
  className?: string;
  tooltip?: string;
};

const CONFIG: Record<DifficultyLevel, { label: string; color: string; icon: string }> = {
  easy: { label: 'difficulty.easy', color: 'text-green-500 bg-green-50', icon: '🟢' },
  medium: { label: 'difficulty.medium', color: 'text-amber-500 bg-amber-50', icon: '🟡' },
  hard: { label: 'difficulty.hard', color: 'text-red-500 bg-red-50', icon: '🔴' },
};

export function DifficultyBadge({ level, className, tooltip }: DifficultyBadgeProps) {
  const t = useTranslations();
  const config = CONFIG[level];

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 border-none px-2 py-1 text-xs shadow-sm',
        config.color,
        className,
      )}
    >
      <span aria-hidden>{config.icon}</span>
      <span>{t(config.label)}</span>
    </Badge>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
