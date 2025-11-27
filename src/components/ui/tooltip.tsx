'use client';

import * as React from 'react';

type TooltipProps = {
  children: React.ReactNode;
};

export const TooltipProvider = ({ children }: TooltipProps) => <>{children}</>;

export const Tooltip = ({ children }: TooltipProps) => <>{children}</>;

type TooltipTriggerProps = React.HTMLAttributes<HTMLSpanElement> & {
  asChild?: boolean;
  children: React.ReactNode;
};

export const TooltipTrigger = React.forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) =>
    asChild ? (
      <>{children}</>
    ) : (
      <span ref={ref} {...props}>
        {children}
      </span>
    ),
);
TooltipTrigger.displayName = 'TooltipTrigger';

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ),
);
TooltipContent.displayName = 'TooltipContent';
