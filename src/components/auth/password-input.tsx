'use client';

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from 'react';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { INPUT_SIZES, type Size } from '@/components/ui/variants';

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: Size;
  error?: boolean | string;
  label?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      size = 'md',
      error,
      label,
      helperText,
      className,
      wrapperClassName,
      id,
      disabled,
      ...props
    },
    ref
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const sizeStyles = INPUT_SIZES[size];

    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorMessage = typeof error === 'string' ? error : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;
    const isError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={isVisible ? 'text' : 'password'}
            className={cn(
              'flex w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors motion-safe:transition-colors',
              sizeStyles.input,
              sizeStyles.paddingStart,
              'pe-12',
              isError &&
                'border-coral-500 focus-visible:ring-coral-500 focus-visible:ring-offset-coral-500/10',
              className
            )}
            aria-invalid={isError || undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute end-1 top-1/2 -translate-y-1/2 px-2"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            disabled={disabled}
          >
            <Icon name={isVisible ? 'eye-off' : 'eye'} size="sm" />
          </Button>
        </div>
        {helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {errorMessage && (
          <p id={errorId} className="text-sm text-coral-500">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
