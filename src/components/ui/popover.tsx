'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn, mergeRefs } from '@/lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

const PopoverContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}>({
  open: false,
  onOpenChange: () => {},
  triggerRef: { current: null },
});

export function Popover({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);
  
  const open = controlledOpen ?? uncontrolledOpen;
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen;

  return (
    <PopoverContext.Provider value={{ open, onOpenChange: handleOpenChange, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const { open, onOpenChange, triggerRef } = React.useContext(PopoverContext);

  const child = asChild ? React.Children.only(children) : <button type="button">{children}</button>;
  const element = child as React.ReactElement & { ref?: React.Ref<HTMLElement> };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Call the original onClick if it exists
    if (element.props.onClick) {
      element.props.onClick(e);
    }

    onOpenChange(!open);
  };

  const childRef = element.ref;

  return React.cloneElement(element, {
    ref: mergeRefs(triggerRef, childRef),
    onClick: handleClick,
    'aria-haspopup': true,
    'aria-expanded': open,
  });
}

export function PopoverContent({
  children,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: PopoverContentProps) {
  const { open, onOpenChange, triggerRef } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    const margin = 8; // Safety margin from viewport edges
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;

    // Calculate initial position
    switch (align) {
      case 'start':
        x = triggerRect.left;
        break;
      case 'center':
        x = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'end':
        x = triggerRect.right - contentRect.width;
        break;
    }

    switch (side) {
      case 'top':
        y = triggerRect.top - contentRect.height - sideOffset;
        break;
      case 'bottom':
        y = triggerRect.bottom + sideOffset;
        break;
      case 'left':
        x = triggerRect.left - contentRect.width - sideOffset;
        y = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        break;
      case 'right':
        x = triggerRect.right + sideOffset;
        y = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        break;
    }

    // Clamp to viewport
    x = Math.min(Math.max(margin, x), viewportWidth - contentRect.width - margin);
    y = Math.min(Math.max(margin, y), viewportHeight - contentRect.height - margin);

    // Flip to opposite side if needed
    if (side === 'bottom' && y + contentRect.height > viewportHeight - margin) {
      y = triggerRect.top - contentRect.height - sideOffset;
    } else if (side === 'top' && y < margin) {
      y = triggerRect.bottom + sideOffset;
    }

    contentRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, [align, side, sideOffset, triggerRef, contentRef]);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [open, align, side, sideOffset, triggerRef, contentRef, updatePosition]);

  // Handle Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange, triggerRef, contentRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'fixed left-0 top-0 z-50 w-72 rounded-md border bg-background p-4 shadow-md animate-fade-in',
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}