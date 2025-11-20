import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'bordered' | 'elevated';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', hoverable = false, className, ...props },
  ref,
) {
  const variantClasses: Record<CardVariant, string> = {
    default: 'border border-border shadow-sm',
    bordered: 'border-2 border-border shadow-sm',
    elevated: 'shadow-md',
  };

  const hoverClasses = hoverable
    ? cn(
        'cursor-pointer motion-safe:hover:shadow-lg hover:shadow-lg',
        variant !== 'elevated' && 'hover:border-aqua-500'
      )
    : '';

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg bg-background transition-shadow motion-safe:transition-shadow',
        variantClasses[variant],
        hoverClasses,
        className
      )}
      {...props}
    />
  );
});

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

type HeadingTag = keyof Pick<
  JSX.IntrinsicElements,
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>;

export interface CardTitleProps
  extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingTag;
}

export function CardTitle({
  as: Component = 'h3',
  className,
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-4 p-6 pt-0', className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-2 p-6 pt-0', className)}
      {...props}
    />
  );
}
