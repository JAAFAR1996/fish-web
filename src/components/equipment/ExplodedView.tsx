'use client';

import { useMemo } from 'react';

import type { EquipmentPart } from '@/types';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ExplodedViewProps = {
  parts: EquipmentPart[];
  image?: string;
  className?: string;
};

export function ExplodedView({ parts, image, className }: ExplodedViewProps) {
  const normalized = useMemo(
    () => parts.slice(0, 8).map((part, idx) => ({ ...part, order: idx + 1 })),
    [parts],
  );

  return (
    <Card className={cn('relative overflow-hidden p-4', className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="Equipment exploded view" className="h-full w-full rounded-lg object-cover" />
      ) : (
        <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-900 to-slate-700" />
      )}
      <TooltipProvider>
        {normalized.map((part) => (
          <Tooltip key={part.id}>
            <TooltipTrigger
              style={{ left: `${part.position.x}%`, top: `${part.position.y}%` }}
              className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/10 text-xs font-semibold text-white backdrop-blur"
            >
              {part.order}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">{part.name}</p>
              <p className="text-sm text-muted-foreground">{part.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </Card>
  );
}
