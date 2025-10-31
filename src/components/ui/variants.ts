import { cn } from '@/lib/utils';

export type Size = 'sm' | 'md' | 'lg';

export type Variant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

type VariantDefinitions = Record<string, Record<string, string>>;

type VariantSelection<Variants extends VariantDefinitions> = Partial<{
  [K in keyof Variants]: keyof Variants[K];
}>;

type CompoundVariant<Variants extends VariantDefinitions> = {
  variants: VariantSelection<Variants>;
  class: string;
};

type CreateVariantsConfig<Variants extends VariantDefinitions> = {
  base?: string;
  variants: Variants;
  defaultVariants?: VariantSelection<Variants>;
  compoundVariants?: Array<CompoundVariant<Variants>>;
};

type VariantOptions<Variants extends VariantDefinitions> =
  VariantSelection<Variants> & { className?: string };

type VariantFunction<Variants extends VariantDefinitions> = (
  options?: VariantOptions<Variants>
) => string;

export type VariantProps<T extends VariantFunction<any>> = NonNullable<
  Parameters<T>[0]
>;

export const BUTTON_SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-11 px-6 text-lg',
};

export const INPUT_SIZES: Record<
  Size,
  {
    input: string;
    paddingStart: string;
    paddingEnd: string;
    iconPaddingStart: string;
    iconPaddingEnd: string;
  }
> = {
  sm: {
    input: 'h-9 text-sm',
    paddingStart: 'ps-3',
    paddingEnd: 'pe-3',
    iconPaddingStart: 'ps-10',
    iconPaddingEnd: 'pe-10',
  },
  md: {
    input: 'h-10 text-base',
    paddingStart: 'ps-4',
    paddingEnd: 'pe-4',
    iconPaddingStart: 'ps-11',
    iconPaddingEnd: 'pe-11',
  },
  lg: {
    input: 'h-11 text-lg',
    paddingStart: 'ps-5',
    paddingEnd: 'pe-5',
    iconPaddingStart: 'ps-12',
    iconPaddingEnd: 'pe-12',
  },
};

export const ICON_SIZES: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function createVariants<
  Variants extends VariantDefinitions,
  Defaults extends VariantSelection<Variants> = VariantSelection<Variants>
>(
  config: CreateVariantsConfig<Variants>
): VariantFunction<Variants> {
  const {
    base = '',
    variants,
    defaultVariants,
    compoundVariants = [],
  } = config;

  return (
    options: VariantOptions<Variants> = {} as VariantOptions<Variants>
  ) => {
    const { className, ...passedVariants } = options;
    const variantValues = passedVariants as unknown as VariantSelection<Variants>;
    const mergedVariants: VariantSelection<Variants> = {
      ...defaultVariants,
      ...variantValues,
    };

    const classes: string[] = [base];

    for (const variantName in variants) {
      const value = mergedVariants[variantName];
      if (!value) {
        continue;
      }

      const variantClasses = variants[variantName][value];
      if (variantClasses) {
        classes.push(variantClasses);
      }
    }

    for (const compoundVariant of compoundVariants) {
      const matches = Object.entries(compoundVariant.variants).every(
        ([key, value]) => mergedVariants[key as keyof typeof mergedVariants] === value
      );

      if (matches) {
        classes.push(compoundVariant.class);
      }
    }

    if (className) {
      classes.push(className);
    }

    return cn(...classes);
  };
}

export const buttonVariants = createVariants({
  base: 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-background border border-border text-foreground hover:bg-muted',
      primary:
        'bg-aqua-500 text-white hover:bg-aqua-600 focus-visible:ring-aqua-500',
      secondary:
        'bg-sand-500 text-white hover:bg-sand-600 focus-visible:ring-sand-500',
      outline:
        'border-2 border-aqua-500 text-aqua-500 bg-transparent hover:bg-aqua-50 dark:hover:bg-aqua-950',
      ghost: 'bg-transparent text-foreground hover:bg-muted',
      destructive:
        'bg-coral-500 text-white hover:bg-coral-600 focus-visible:ring-coral-500',
    },
    size: BUTTON_SIZES,
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export const badgeVariants = createVariants({
  base: 'inline-flex items-center justify-center rounded-full font-medium transition-colors motion-safe:transition-colors',
  variants: {
    variant: {
      default: 'bg-muted text-foreground',
      primary: 'bg-aqua-500 text-white',
      secondary: 'bg-sand-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-gray-900',
      destructive: 'bg-coral-500 text-white',
      info: 'bg-aqua-100 text-aqua-700 dark:bg-aqua-900 dark:text-aqua-100',
      outline: 'border border-border text-foreground bg-transparent',
    },
    size: {
      sm: 'min-h-[1.25rem] h-5 px-2 text-xs',
      md: 'min-h-[1.5rem] h-6 px-2.5 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
