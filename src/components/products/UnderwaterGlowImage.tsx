'use client';

import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/config/features';

type UnderwaterGlowImageProps = ImageProps & {
  glow?: boolean;
  className?: string;
};

export function UnderwaterGlowImage({
  glow = true,
  className,
  alt = '',
  ...props
}: UnderwaterGlowImageProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-500',
        glow && FEATURES.neonOceanTheme && 'underwater-glow glow-pulse',
        className,
      )}
    >
      <Image
        {...props}
        alt={alt}
        className={cn(
          'h-full w-full object-cover transition-transform duration-700 ease-out',
          glow && FEATURES.neonOceanTheme && 'slow-zoom',
        )}
      />
      {glow && FEATURES.neonOceanTheme && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(0,217,255,0.08),transparent_30%)]" />
      )}
    </div>
  );
}
