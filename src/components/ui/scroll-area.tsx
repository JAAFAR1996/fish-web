import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'h-full w-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}