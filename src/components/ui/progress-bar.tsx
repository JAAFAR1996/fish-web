'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  status: 'optimal' | 'adequate' | 'insufficient';
  showValue?: boolean;
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HEIGHT_MAP = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const STATUS_COLORS = {
  optimal: 'bg-green-500',
  adequate: 'bg-yellow-500',
  insufficient: 'bg-coral-500',
};

export function ProgressBar({
  value,
  min = 0,
  max = 100,
  label,
  unit = '',
  status,
  showValue = true,
  showPercentage = false,
  height = 'md',
  className,
}: ProgressBarProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div className={cn('w-full', className)}>
      {(label || (showValue && (unit || showPercentage))) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-sand-900 dark:text-sand-100">
              {label}
            </span>
          )}
          {showValue && (unit || showPercentage) && (
            <span className={cn('text-sm font-semibold', STATUS_COLORS[status].replace('bg-', 'text-'))}>
              {showPercentage ? `${Math.round(percentage)}%` : `${value}${unit ? ` ${unit}` : ''}`}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-sand-200 dark:bg-sand-800',
          HEIGHT_MAP[height]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out motion-safe:transition-all motion-safe:animate-progress-fill',
            STATUS_COLORS[status]
          )}
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>
    </div>
  );
}



