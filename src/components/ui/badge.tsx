import type { HTMLAttributes } from 'react';

import { badgeVariants, type VariantProps } from './variants';

type BadgeVariantOptions = VariantProps<typeof badgeVariants>;

export type BadgeVariant = NonNullable<BadgeVariantOptions['variant']>;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  BadgeVariantOptions;

export function Badge({
  className,
  variant,
  size,
  ...props
}: BadgeProps) {
  return (
    <span
      className={badgeVariants({ variant, size, className })}
      {...props}
    />
  );
}
