'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';

import { Icon, type IconName } from '@/components/ui/icon';
import { ICON_SIZES, type Size } from '@/components/ui/variants';
import { FEATURES } from '@/lib/config/features';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { useLottieJson } from './useLottieJson';
import { cn } from '@/lib/utils';

export interface LottieIconProps {
  animationUrl?: string;
  animationData?: Record<string, unknown>;
  fallbackIcon: IconName;
  size?: Size | number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  lottieRef?: MutableRefObject<LottieRefCurrentProps | null>;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

const resolveSize = (size?: Size | number): number => {
  if (typeof size === 'number') {
    return size;
  }

  if (size && ICON_SIZES[size]) {
    return ICON_SIZES[size];
  }

  return ICON_SIZES.md;
};

export function LottieIcon({
  animationUrl,
  animationData,
  fallbackIcon,
  size,
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  lottieRef,
  ariaLabel,
  ariaHidden = true,
}: LottieIconProps) {
  const reducedMotion = prefersReducedMotion();
  const resolvedSize = resolveSize(size);

  const shouldUseLottie =
    typeof window !== 'undefined' &&
    FEATURES.lottie &&
    !reducedMotion &&
    (animationData || animationUrl);

  const cacheKey = animationUrl ? `lottie-cache-${fallbackIcon}-${animationUrl}` : undefined;

  const { data, error, loading } = useLottieJson(animationUrl ?? '', {
    cacheKey,
    fallbackData: animationData,
  });

  const animationSource = useMemo(() => {
    if (animationData) {
      return animationData;
    }
    return data ?? null;
  }, [animationData, data]);

  const internalRef = useRef<LottieRefCurrentProps>(null);
  const mergedRef = lottieRef ?? internalRef;

  useEffect(() => {
    if (!mergedRef.current || speed === 1) {
      return;
    }

    mergedRef.current.setSpeed(speed);
  }, [speed, mergedRef]);

  if (!shouldUseLottie || !animationSource || loading || error) {
    return (
      <span
        className={cn('lottie-container', className)}
        style={{ width: resolvedSize, height: resolvedSize }}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
      >
        <Icon
          name={fallbackIcon}
          size={typeof size === 'number' ? undefined : (size as Size)}
          style={typeof size === 'number' ? { width: resolvedSize, height: resolvedSize } : undefined}
          aria-hidden={ariaHidden}
        />
      </span>
    );
  }

  return (
    <span
      className={cn('lottie-container', className)}
      style={{ width: resolvedSize, height: resolvedSize }}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    >
      <Lottie
        lottieRef={mergedRef}
        animationData={animationSource}
        loop={loop}
        autoplay={autoplay}
        className="lottie-fade-in loaded"
        style={{ width: resolvedSize, height: resolvedSize }}
      />
    </span>
  );
}
