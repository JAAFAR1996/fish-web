'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

import { Icon } from './icon';

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  type: AccordionType;
  openItems: string[];
  toggleItem: (value: string) => void;
  isItemOpen: (value: string) => boolean;
  collapsible: boolean;
  registerTrigger: (
    value: string,
    ref: React.RefObject<HTMLButtonElement>,
    disabled: boolean
  ) => void;
  unregisterTrigger: (value: string) => void;
  focusNext: (value: string) => void;
  focusPrevious: (value: string) => void;
  focusFirst: () => void;
  focusLast: () => void;
  setItemDisabled: (value: string, disabled: boolean) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(`${component} must be used within an Accordion component.`);
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  triggerId: string;
  contentId: string;
  disabled: boolean;
}

const AccordionItemContext =
  createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(component: string) {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      `${component} must be used within an AccordionItem component.`
    );
  }
  return context;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export function Accordion({
  type = 'single',
  collapsible = true,
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const isControlled = value !== undefined;

  const normalizeValue = useCallback(
    (val?: string | string[]) => {
      if (val === undefined) return type === 'single' ? [] : [];
      if (type === 'single') {
        return val ? [val as string] : [];
      }
      return Array.isArray(val) ? val : [val];
    },
    [type]
  );

  const [internalValue, setInternalValue] = useState<string[]>(() =>
    normalizeValue(defaultValue)
  );

  const openItems = isControlled
    ? normalizeValue(value)
    : internalValue;

  const triggerRefs = useRef(new Map<string, React.RefObject<HTMLButtonElement>>());
  const triggerOrder = useRef<string[]>([]);
  const disabledItems = useRef(new Map<string, boolean>());

  const updateOrder = useCallback(() => {
    triggerOrder.current = Array.from(triggerRefs.current.keys());
  }, []);

  const getEnabledOrder = useCallback(() => {
    return triggerOrder.current.filter(
      (item) => !disabledItems.current.get(item)
    );
  }, []);

  const setValue = useCallback(
    (next: string[]) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      if (type === 'single') {
        onValueChange?.(next[0] ?? '');
      } else {
        onValueChange?.(next);
      }
    },
    [isControlled, onValueChange, type]
  );

  const toggleItem = useCallback(
    (itemValue: string) => {
      if (disabledItems.current.get(itemValue)) {
        return;
      }
      if (type === 'single') {
        const isOpen = openItems.includes(itemValue);
        if (isOpen) {
          if (!collapsible && openItems.length === 1) {
            return;
          }
          setValue([]);
        } else {
          setValue([itemValue]);
        }
      } else {
        const isOpen = openItems.includes(itemValue);
        if (isOpen) {
          setValue(openItems.filter((entry) => entry !== itemValue));
        } else {
          setValue([...openItems, itemValue]);
        }
      }
    },
    [collapsible, openItems, setValue, type]
  );

  const isItemOpen = useCallback(
    (itemValue: string) => openItems.includes(itemValue),
    [openItems]
  );

  const registerTrigger = useCallback(
    (
      itemValue: string,
      ref: React.RefObject<HTMLButtonElement>,
      disabled: boolean
    ) => {
      triggerRefs.current.set(itemValue, ref);
      if (disabled) {
        disabledItems.current.set(itemValue, true);
      } else {
        disabledItems.current.delete(itemValue);
      }
      updateOrder();
    },
    [updateOrder]
  );

  const unregisterTrigger = useCallback(
    (itemValue: string) => {
      triggerRefs.current.delete(itemValue);
      disabledItems.current.delete(itemValue);
      updateOrder();
    },
    [updateOrder]
  );

  const focusItemByIndex = useCallback(
    (index: number) => {
      const order = getEnabledOrder();
      if (!order.length) return;
      const boundedIndex = (index + order.length) % order.length;
      const key = order[boundedIndex];
      const ref = triggerRefs.current.get(key);
      ref?.current?.focus();
    },
    [getEnabledOrder]
  );

  const getEnabledIndex = useCallback(
    (value: string) => getEnabledOrder().indexOf(value),
    [getEnabledOrder]
  );

  const focusNext = useCallback(
    (value: string) => {
      const index = getEnabledIndex(value);
      if (index === -1) return;
      focusItemByIndex(index + 1);
    },
    [focusItemByIndex, getEnabledIndex]
  );

  const focusPrevious = useCallback(
    (value: string) => {
      const index = getEnabledIndex(value);
      if (index === -1) return;
      focusItemByIndex(index - 1);
    },
    [focusItemByIndex, getEnabledIndex]
  );

  const focusFirst = useCallback(() => {
    const order = getEnabledOrder();
    if (!order.length) return;
    focusItemByIndex(0);
  }, [focusItemByIndex, getEnabledOrder]);

  const focusLast = useCallback(() => {
    const order = getEnabledOrder();
    if (!order.length) return;
    focusItemByIndex(order.length - 1);
  }, [focusItemByIndex, getEnabledOrder]);

  const setItemDisabled = useCallback((itemValue: string, disabled: boolean) => {
    if (disabled) {
      disabledItems.current.set(itemValue, true);
    } else {
      disabledItems.current.delete(itemValue);
    }
  }, []);

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      type,
      openItems,
      toggleItem,
      isItemOpen,
      collapsible,
      registerTrigger,
      unregisterTrigger,
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
      setItemDisabled,
    }),
    [
      collapsible,
      focusFirst,
      focusLast,
      focusNext,
      focusPrevious,
      isItemOpen,
      openItems,
      registerTrigger,
      setItemDisabled,
      toggleItem,
      type,
      unregisterTrigger,
    ]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={cn('divide-y divide-border', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { isItemOpen } = useAccordionContext('AccordionItem');
  const triggerId = useId();
  const contentId = useId();

  const contextValue = useMemo<AccordionItemContextValue>(
    () => ({
      value,
      triggerId,
      contentId,
      disabled,
    }),
    [contentId, disabled, triggerId, value]
  );

  const open = isItemOpen(value);

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled ? 'true' : undefined}
        className={cn('border-b border-border last:border-b-0', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const {
    toggleItem,
    isItemOpen,
    registerTrigger,
    unregisterTrigger,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    setItemDisabled,
  } = useAccordionContext('AccordionTrigger');
  const { value, triggerId, contentId, disabled } = useAccordionItemContext(
    'AccordionTrigger'
  );
  const open = isItemOpen(value);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerTrigger(value, buttonRef, disabled);
    return () => unregisterTrigger(value);
  }, [disabled, registerTrigger, unregisterTrigger, value]);

  useEffect(() => {
    setItemDisabled(value, disabled);
  }, [disabled, setItemDisabled, value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.defaultPrevented) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusNext(value);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPrevious(value);
        break;
      case 'Home':
        event.preventDefault();
        focusFirst();
        break;
      case 'End':
        event.preventDefault();
        focusLast();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!disabled) {
          toggleItem(value);
        }
        break;
      default:
        break;
    }
  };

  return (
    <button
      ref={buttonRef}
      id={triggerId}
      type="button"
      role="button"
      className={cn(
        'group flex w-full items-center justify-between gap-4 py-4 text-start text-base font-medium outline-none transition-colors motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-expanded={open}
      aria-controls={contentId}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? 'true' : undefined}
      disabled={disabled}
      onClick={(event) => {
        props.onClick?.(event);
        if (!disabled) {
          toggleItem(value);
        }
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        handleKeyDown(event);
      }}
      {...props}
    >
      <span className="flex flex-1 items-center text-foreground">
        {children}
      </span>
      <Icon
        name="chevron-down"
        size="sm"
        flipRtl
        className="transition-transform motion-safe:duration-200 data-[state=open]:rotate-180"
        data-state={open ? 'open' : 'closed'}
        aria-hidden="true"
      />
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { isItemOpen } = useAccordionContext('AccordionContent');
  const { value, triggerId, contentId } = useAccordionItemContext(
    'AccordionContent'
  );
  const open = isItemOpen(value);
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    setHeight(ref.current.scrollHeight);
  }, [children, open]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) {
        setHeight(ref.current.scrollHeight);
      }
    });
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden text-sm data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down motion-safe:data-[state=closed]:animate-accordion-up',
        className
      )}
      style={
        {
          '--accordion-content-height': `${height}px`,
        } as CSSProperties
      }
      aria-hidden={!open}
      {...props}
    >
      <div ref={ref} className="pb-4 pt-0">
        {children}
      </div>
    </div>
  );
}
