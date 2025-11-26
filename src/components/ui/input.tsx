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
  mobileLabelInside?: boolean;
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
    mobileLabelInside = false,
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
  const inlineLabel = Boolean(label && mobileLabelInside);
  const computedPlaceholder = props.placeholder ?? (inlineLabel ? label : undefined);
  const computedAriaLabel =
    props['aria-label'] ?? (inlineLabel && label ? label : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-foreground text-start',
            inlineLabel && 'hidden sm:block'
          )}
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
            'flex w-full min-h-[48px] rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors motion-safe:transition-colors text-start',
            sizeStyles.input,
            leadingIcon ? sizeStyles.iconPaddingStart : sizeStyles.paddingStart,
            trailingIcon ? sizeStyles.iconPaddingEnd : sizeStyles.paddingEnd,
            isError &&
              'border-coral-500 focus-visible:ring-coral-500 focus-visible:ring-offset-coral-500/10',
            className
          )}
          aria-invalid={isError || undefined}
          aria-describedby={describedBy}
          aria-label={computedAriaLabel}
          disabled={disabled}
          placeholder={computedPlaceholder}
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
        <p
          id={errorId}
          className="text-sm text-coral-500"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
});
