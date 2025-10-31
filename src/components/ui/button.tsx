'use client';

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from 'react';

import { cn, mergeRefs } from '@/lib/utils';

import { Icon } from './icon';
import { buttonVariants, type Size, type VariantProps } from './variants';

type ButtonVariantOptions = VariantProps<typeof buttonVariants>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantOptions & {
    asChild?: boolean;
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      loading = false,
      className,
      variant,
      size,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const resolvedClassName = buttonVariants({
      variant,
      size,
      className,
    });

    if (asChild) {
      const child = Children.only(children) as ReactElement<Record<string, unknown>>;

      if (!isValidElement(child)) {
        throw new Error(
          'Button with asChild expects a single valid React element child.'
        );
      }

      const isNativeButton =
        typeof child.type === 'string' && child.type === 'button';
      const disabledState = Boolean(disabled || loading);

      const mergedProps: Record<string, unknown> = {
        className: cn(resolvedClassName, child.props.className as string),
        ...props,
        ref: mergeRefs((child as any).ref, ref),
      };

      if (disabledState) {
        if (isNativeButton) {
          mergedProps.disabled = true;
        } else {
          mergedProps['aria-disabled'] = true;
        }
      } else if (!isNativeButton && child.props['aria-disabled'] !== undefined) {
        mergedProps['aria-disabled'] = child.props['aria-disabled'];
      }

      if (loading) {
        mergedProps['aria-busy'] = true;
      }

      return cloneElement(child, mergedProps);
    }

    return (
      <button
        ref={ref}
        className={resolvedClassName}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading ? true : undefined}
        {...props}
      >
        {loading && (
          <Icon
            name="loader"
            size={size ? (size as Size) : 'md'}
            className="motion-safe:animate-spin"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
