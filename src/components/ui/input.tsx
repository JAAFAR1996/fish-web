'use client';

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

import { INPUT_SIZES, type Size } from './variants';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: Size;
  error?: boolean | string;
  label?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    error,
    label,
    helperText,
    leadingIcon,
    trailingIcon,
    className,
    wrapperClassName,
    id,
    disabled,
    ...props
  },
  ref
) {
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
        {leadingIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors motion-safe:transition-colors',
            sizeStyles.input,
            leadingIcon ? sizeStyles.iconPaddingStart : sizeStyles.paddingStart,
            trailingIcon ? sizeStyles.iconPaddingEnd : sizeStyles.paddingEnd,
            isError &&
              'border-coral-500 focus-visible:ring-coral-500 focus-visible:ring-offset-coral-500/10',
            className
          )}
          aria-invalid={isError || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          {...props}
        />
        {trailingIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground"
            aria-hidden="true"
          >
            {trailingIcon}
          </span>
        )}
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
});
