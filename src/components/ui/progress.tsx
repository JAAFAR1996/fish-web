'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  max?: number;
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, ...props }, ref) => {
    const clamped = Math.min(Math.max(value, 0), max);
    const width = `${(clamped / max) * 100}%`;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-muted',
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-aqua-500 to-cyan-400 transition-[width]"
          style={{ width }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
