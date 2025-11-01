'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  CART_SYNC_DEBOUNCE,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '@/lib/cart/constants';

export type QuantitySelectorProps = {
  value: number;
  onChange: (quantity: number) => void;
  max?: number;
  min?: number;
  stock: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

export function QuantitySelector({
  value,
  onChange,
  max = MAX_QUANTITY,
  min = MIN_QUANTITY,
  stock,
  disabled = false,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const t = useTranslations('cart.quantity');
  const [localValue, setLocalValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  const clampedMax = useMemo(() => Math.min(max, stock), [max, stock]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;

    setIsUpdating(true);
    const timer = window.setTimeout(() => {
      onChange(localValue);
      setIsUpdating(false);
    }, CART_SYNC_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [localValue, onChange, value]);

  const handleIncrement = useCallback(() => {
    setLocalValue((prev) => {
      const next = Math.min(prev + 1, clampedMax);
      return next;
    });
  }, [clampedMax]);

  const handleDecrement = useCallback(() => {
    setLocalValue((prev) => {
      const next = Math.max(prev - 1, min);
      return next;
    });
  }, [min]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const next = Number(raw);
      if (Number.isNaN(next)) return;

      const clamped = Math.max(min, Math.min(clampedMax, next));
      setLocalValue(clamped);
    },
    [clampedMax, min]
  );

  const decreaseDisabled = disabled || localValue <= min;
  const increaseDisabled = disabled || localValue >= clampedMax;

  const sizeClasses =
    size === 'sm'
      ? {
          container: 'h-10',
          input: 'w-12 text-sm',
          button: 'h-10 w-10',
        }
      : {
          container: 'h-11',
          input: 'w-16 text-base',
          button: 'h-11 w-11',
        };

  return (
    <div
      className={cn(
        'flex items-center rounded-md border border-border bg-background',
        sizeClasses.container,
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(sizeClasses.button, 'rounded-s-md')}
        onClick={handleDecrement}
        disabled={decreaseDisabled}
        aria-label={t('decrease')}
      >
        <Icon name="minus" size="sm" />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        value={localValue}
        onChange={handleInputChange}
        min={min}
        max={clampedMax}
        disabled={disabled}
        aria-label={t('update')}
        className={cn(
          sizeClasses.input,
          'border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0'
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(sizeClasses.button, 'rounded-e-md')}
        onClick={handleIncrement}
        disabled={increaseDisabled}
        aria-label={t('increase')}
      >
        <Icon name="plus" size="sm" />
      </Button>
      {isUpdating && (
        <Icon
          name="loader"
          size="sm"
          className="ms-2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
