'use client';

import { LottieIcon } from '@/components/animations';
import { Card } from '@/components/ui/card';
import { FEATURES } from '@/lib/config/features';

type TechnicalIconsProps = {
  className?: string;
};

const ICONS = [
  { id: 'flow', label: 'Flow', animationUrl: '/animations/flow.json' },
  { id: 'power', label: 'Power', animationUrl: '/animations/power.json' },
  { id: 'noise', label: 'Noise', animationUrl: '/animations/noise.json' },
  { id: 'install', label: 'Install', animationUrl: '/animations/assemble.json' },
];

export function TechnicalIcons({ className }: TechnicalIconsProps) {
  if (!FEATURES.lottie) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ICONS.map((icon) => (
          <Card key={icon.id} className="flex flex-col items-center gap-2 border bg-background/70 p-3">
            <LottieIcon
              animationUrl={icon.animationUrl}
              fallbackIcon="sparkles"
              size="lg"
              autoplay
              loop
              className="lottie-fade-in"
            />
            <span className="text-sm font-semibold">{icon.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
