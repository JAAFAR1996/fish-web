'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { calculateTimeRemaining, type CountdownTime } from '@/lib/marketing/flash-sales-helpers';

type CountdownTimerProps = {
  endsAt: string;
  className?: string;
  onComplete?: () => void;
};

export function CountdownTimer({ endsAt, className, onComplete }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<CountdownTime>(() => calculateTimeRemaining(endsAt));
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    hasCompletedRef.current = false;
    setTimeRemaining(calculateTimeRemaining(endsAt));

    const interval = window.setInterval(() => {
      setTimeRemaining(() => {
        const next = calculateTimeRemaining(endsAt);

        if (next.totalMs <= 0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          window.clearInterval(interval);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [endsAt]);

  if (timeRemaining.totalMs <= 0) {
    return (
      <span className={cn('font-mono text-xs font-semibold text-muted-foreground', className)}>
        00:00
      </span>
    );
  }

  const dayPart =
    timeRemaining.days > 0 ? `${timeRemaining.days}d` : null;
  const hours = String(timeRemaining.hours).padStart(2, '0');
  const minutes = String(timeRemaining.minutes).padStart(2, '0');
  const seconds = String(timeRemaining.seconds).padStart(2, '0');

  return (
    <span
      className={cn(
        'font-mono text-xs font-semibold uppercase tracking-wide text-destructive',
        className
      )}
    >
      {dayPart ? `${dayPart} ${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`}
    </span>
  );
}
