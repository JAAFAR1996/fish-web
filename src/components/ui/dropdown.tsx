'use client';

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';

import { cn, mergeRefs } from '@/lib/utils';

type ElementWithRef<T extends Element> = ReactElement & { ref?: Ref<T>; props: Record<string, unknown> };
type Align = 'start' | 'center' | 'end';
type Side = 'top' | 'bottom' | 'left' | 'right';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (value: boolean) => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  menuRef: React.RefObject<HTMLDivElement>;
  menuId: string;
  triggerId: string | null;
  setTriggerId: (id: string | null) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  focusItem: (index: number) => void;
  focusFirstItem: () => void;
  focusLastItem: () => void;
  focusNextItem: () => void;
  focusPreviousItem: () => void;
  focusItemByMatch: (search: string) => void;
  focusOnOpenRef: React.MutableRefObject<'first' | 'last' | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string) {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(`${component} must be used within a DropdownMenu component.`);
  }
  return context;
}

export interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function DropdownMenu({
  open: openProp,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const focusOnOpenRef = useRef<'first' | 'last' | null>(null);

  const open = isControlled ? Boolean(openProp) : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
      if (!value) {
        setActiveIndex(-1);
        focusOnOpenRef.current = null;
      }
    },
    [focusOnOpenRef, isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const getFocusableItems = useCallback((): HTMLElement[] => {
    const menu = menuRef.current;
    if (!menu) return [];
    return Array.from(
      menu.querySelectorAll<HTMLElement>('[data-menu-item="true"]')
    );
  }, []);

  const focusItem = useCallback(
    (index: number) => {
      const items = getFocusableItems();
      if (!items.length) return;
      const boundedIndex = (index + items.length) % items.length;
      const item = items[boundedIndex];
      setActiveIndex(boundedIndex);
      requestAnimationFrame(() => {
        item.focus();
      });
    },
    [getFocusableItems]
  );

  const focusFirstItem = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const focusLastItem = useCallback(() => {
    const items = getFocusableItems();
    if (!items.length) return;
    focusItem(items.length - 1);
  }, [focusItem, getFocusableItems]);

  const focusNextItem = useCallback(() => {
    const items = getFocusableItems();
    if (!items.length) return;
    const nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % items.length;
    focusItem(nextIndex);
  }, [activeIndex, focusItem, getFocusableItems]);

  const focusPreviousItem = useCallback(() => {
    const items = getFocusableItems();
    if (!items.length) return;
    const prevIndex =
      activeIndex < 0
        ? items.length - 1
        : (activeIndex - 1 + items.length) % items.length;
    focusItem(prevIndex);
  }, [activeIndex, focusItem, getFocusableItems]);

  const focusItemByMatch = useCallback(
    (search: string) => {
      const items = getFocusableItems();
      if (!items.length) return;
      const normalized = search.toLowerCase();
      const startIndex = activeIndex < 0 ? 0 : activeIndex + 1;
      const orderedItems = [
        ...items.slice(startIndex),
        ...items.slice(0, startIndex),
      ];
      const found = orderedItems.find((item) =>
        item.innerText.trim().toLowerCase().startsWith(normalized)
      );
      if (found) {
        const index = items.indexOf(found);
        if (index >= 0) {
          focusItem(index);
        }
      }
    },
    [activeIndex, focusItem, getFocusableItems]
  );
  const value = useMemo<DropdownMenuContextValue>(
    () => ({
      open,
      setOpen,
      close,
      triggerRef,
      menuRef,
      menuId,
      triggerId,
      setTriggerId,
      activeIndex,
      setActiveIndex,
      focusItem,
      focusFirstItem,
      focusLastItem,
      focusNextItem,
      focusPreviousItem,
      focusItemByMatch,
      focusOnOpenRef,
    }),
    [
      activeIndex,
      close,
      focusFirstItem,
      focusItem,
      focusItemByMatch,
      focusLastItem,
      focusNextItem,
      focusOnOpenRef,
      focusPreviousItem,
      menuId,
      open,
      setOpen,
      setActiveIndex,
      setTriggerId,
      triggerId,
      triggerRef,
      menuRef,
    ]
  );

  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={value}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = ({
  asChild = false,
  className,
  disabled,
  children,
  ...props
}: DropdownMenuTriggerProps) => {
  const {
    open,
    setOpen,
    triggerRef,
    menuId,
    setTriggerId,
    focusOnOpenRef,
  } = useDropdownMenuContext('DropdownMenuTrigger');

  const { onClick, onKeyDown, id: providedId, ...restProps } = props;
  const triggerOnClick = onClick as
    | ((event: React.MouseEvent<HTMLElement>) => void)
    | undefined;
  const triggerOnKeyDown = onKeyDown as
    | ((event: React.KeyboardEvent<HTMLElement>) => void)
    | undefined;

  const autoId = useId();
  let childElement: ElementWithRef<HTMLElement> | null = null;
  let childProvidedId: string | undefined;
  let childRef: Ref<HTMLElement> | undefined;

  if (asChild) {
    const onlyChild = Children.only(children);
    if (!isValidElement(onlyChild)) {
      throw new Error(
        'DropdownMenuTrigger with asChild expects a single valid React element child.'
      );
    }
    childElement = onlyChild as ElementWithRef<HTMLElement>;
    childProvidedId = onlyChild.props.id as string | undefined;
    childRef = childElement.ref;
  }

  const resolvedId =
    (providedId as string | undefined) ??
    childProvidedId ??
    `dropdown-trigger-${autoId}`;

  useEffect(() => {
    setTriggerId(resolvedId);
    return () => setTriggerId(null);
  }, [resolvedId, setTriggerId]);

  const disabledState = Boolean(disabled);

  const handleToggle = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.preventDefault();
      if (disabledState) return;
      if (!open) {
        focusOnOpenRef.current = 'first';
      }
      setOpen(!open);
    },
    [disabledState, focusOnOpenRef, open, setOpen]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabledState) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open) {
          focusOnOpenRef.current = event.key === 'ArrowUp' ? 'last' : 'first';
        }
        setOpen(true);
      }
    },
    [disabledState, focusOnOpenRef, open, setOpen]
  );

  if (childElement) {
    const existingOnClick = childElement.props.onClick as
      | ((event: React.MouseEvent<HTMLElement>) => void)
      | undefined;
    const existingOnKeyDown = childElement.props.onKeyDown as
      | ((event: React.KeyboardEvent<HTMLElement>) => void)
      | undefined;
    const existingClassName = childElement.props.className as string | undefined;
    const isNativeButton = typeof childElement.type === 'string' && childElement.type === 'button';

    const cloned = cloneElement(
      childElement,
      {
        ...restProps,
        id: resolvedId,
        ref: childRef !== undefined ? mergeRefs<HTMLElement>(triggerRef, childRef) : triggerRef,
        role: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
        'data-state': open ? 'open' : 'closed',
        'aria-disabled':
          !isNativeButton && disabledState ? true : childElement.props['aria-disabled'],
        ...(isNativeButton && disabledState ? { disabled: true } : {}),
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          existingOnClick?.(event);
          triggerOnClick?.(event);
          handleToggle(event);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          existingOnKeyDown?.(event);
          triggerOnKeyDown?.(event);
          handleKeyDown(event);
        },
        className: cn(existingClassName, className),
      }
    );

    return cloned;
  }

  return (
    <button
      ref={triggerRef}
      id={resolvedId}
      type="button"
      className={className}
      disabled={disabledState}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      data-state={open ? 'open' : 'closed'}
      onClick={(event) => {
        triggerOnClick?.(event);
        handleToggle(event);
      }}
      onKeyDown={(event) => {
        triggerOnKeyDown?.(event);
        handleKeyDown(event);
      }}
      {...restProps}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps
  extends HTMLAttributes<HTMLDivElement> {
  align?: Align;
  side?: Side;
  sideOffset?: number;
}

export const DropdownMenuContent = ({
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  className,
  style,
  children,
  ...props
}: DropdownMenuContentProps) => {
  const {
    open,
    close,
    triggerRef,
    menuRef,
    menuId,
    triggerId,
    focusFirstItem,
    focusLastItem,
    focusNextItem,
    focusPreviousItem,
    focusItemByMatch,
    setActiveIndex,
    focusOnOpenRef,
  } = useDropdownMenuContext('DropdownMenuContent');

  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const typeaheadBuffer = useRef('');
  const typeaheadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTypeahead = () => {
    if (typeaheadTimeout.current) {
      clearTimeout(typeaheadTimeout.current);
      typeaheadTimeout.current = null;
    }
    typeaheadBuffer.current = '';
  };

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = triggerRect.bottom + sideOffset;
    let left = triggerRect.left;

    switch (side) {
      case 'top':
        top = triggerRect.top - menuRect.height - sideOffset;
        break;
      case 'bottom':
        top = triggerRect.bottom + sideOffset;
        break;
      case 'left':
        left = triggerRect.left - menuRect.width - sideOffset;
        top = triggerRect.top;
        break;
      case 'right':
        left = triggerRect.right + sideOffset;
        top = triggerRect.top;
        break;
      default:
        break;
    }

    if (side === 'top' || side === 'bottom') {
      if (align === 'center') {
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
      } else if (align === 'end') {
        left = triggerRect.right - menuRect.width;
      }
    } else {
      if (align === 'center') {
        top = triggerRect.top + triggerRect.height / 2 - menuRect.height / 2;
      } else if (align === 'end') {
        top = triggerRect.bottom - menuRect.height;
      }
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    left = Math.min(
      Math.max(8, left),
      Math.max(0, viewportWidth - menuRect.width - 8)
    );

    top = Math.min(
      Math.max(8, top),
      Math.max(0, viewportHeight - menuRect.height - 8)
    );

    setPosition({ top, left });
  }, [align, side, sideOffset, triggerRef, menuRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (focusOnOpenRef.current === 'last') {
          focusLastItem();
        } else {
          focusFirstItem();
        }
        focusOnOpenRef.current = null;
      });
    } else {
      setActiveIndex(-1);
      resetTypeahead();
    }
  }, [focusFirstItem, focusLastItem, open, setActiveIndex, focusOnOpenRef]);
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [close, menuRef, open, triggerRef]);

  useEffect(() => {
    return () => resetTypeahead();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPreviousItem();
        break;
      case 'Home':
        event.preventDefault();
        focusFirstItem();
        break;
      case 'End':
        event.preventDefault();
        focusLastItem();
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const char = event.key.toLowerCase();
          typeaheadBuffer.current += char;
          focusItemByMatch(typeaheadBuffer.current);
          if (typeaheadTimeout.current) {
            clearTimeout(typeaheadTimeout.current);
          }
          typeaheadTimeout.current = setTimeout(resetTypeahead, 500);
        }
        break;
    }
  };

  if (!open) return null;

  const content = (
    <div
      ref={mergeRefs(menuRef)}
      role="menu"
      aria-labelledby={triggerId ?? undefined}
      id={menuId}
      tabIndex={-1}
      aria-orientation="vertical"
      className={cn(
        'fixed z-50 min-w-[8rem] rounded-md border border-border bg-background p-1 shadow-lg data-[state=open]:animate-fade-in motion-safe:transition-opacity',
        className
      )}
      data-state={open ? 'open' : 'closed'}
      style={{ top: position.top, left: position.left, ...style }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
};

export interface DropdownMenuItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  onSelect?: () => void;
}

export const DropdownMenuItem = ({
  className,
  disabled = false,
  onSelect,
  children,
  ...props
}: DropdownMenuItemProps) => {
  const { close, focusItem } = useDropdownMenuContext('DropdownMenuItem');
  const itemRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) return;
    onSelect?.();
    close();
  };

  return (
    <button
      ref={itemRef}
      type="button"
      role="menuitem"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors motion-safe:transition-colors focus:bg-muted focus:text-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className
      )}
      data-menu-item="true"
      data-disabled={disabled ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      onClick={(event) => {
        props.onClick?.(event);
        handleSelect(event);
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSelect(event);
        }
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        const items = itemRef.current?.parentElement
          ?.querySelectorAll<HTMLElement>('[data-menu-item="true"]');
        if (!items || !itemRef.current) return;
        const index = Array.from(items).indexOf(itemRef.current);
        if (index >= 0) {
          focusItem(index);
        }
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        if (event.pointerType === 'mouse' && !disabled) {
          itemRef.current?.focus();
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuLabel = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'px-2 py-1.5 text-sm font-semibold text-muted-foreground',
      className
    )}
    role="presentation"
    {...props}
  />
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    role="separator"
    className={cn('my-1 h-px bg-border', className)}
    {...props}
  />
);
