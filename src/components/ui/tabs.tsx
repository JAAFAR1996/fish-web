'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

type TabsOrientation = 'horizontal' | 'vertical';
type TabsActivationMode = 'automatic' | 'manual';

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  focusedValue: string;
  setFocusedValue: (value: string) => void;
  orientation: TabsOrientation;
  activationMode: TabsActivationMode;
  registerTab: (value: string, ref: React.RefObject<HTMLButtonElement>) => void;
  unregisterTab: (value: string) => void;
  focusNext: (current: string) => void;
  focusPrevious: (current: string) => void;
  focusFirst: () => void;
  focusLast: () => void;
  isTabDisabled: (value: string) => boolean;
  registerDisabledTab: (value: string, disabled: boolean) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used within the Tabs component.`);
  }
  return context;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  activationMode?: TabsActivationMode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'manual',
  className,
  children,
  ...props
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? ''
  );
  const [focusedValue, setFocusedValue] = useState<string>(
    value ?? defaultValue ?? ''
  );

  const tabOrder = useRef<string[]>([]);
  const tabRefs = useRef(new Map<string, React.RefObject<HTMLButtonElement>>());
  const disabledTabs = useRef(new Map<string, boolean>());

  const activeValue = isControlled ? (value as string) : internalValue;

  useEffect(() => {
    if (value !== undefined) {
      setFocusedValue(value);
    }
  }, [value]);

  const setActiveValue = useCallback(
    (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      onValueChange?.(val);
    },
    [isControlled, onValueChange]
  );

  const registerTab = useCallback(
    (val: string, ref: React.RefObject<HTMLButtonElement>) => {
      tabRefs.current.set(val, ref);
      if (!tabOrder.current.includes(val)) {
        tabOrder.current.push(val);
      }
      if (!focusedValue) {
        setFocusedValue(val);
      }
      if (!activeValue) {
        setActiveValue(val);
      }
    },
    [activeValue, focusedValue, setActiveValue]
  );

  const unregisterTab = useCallback((val: string) => {
    tabRefs.current.delete(val);
    tabOrder.current = tabOrder.current.filter((item) => item !== val);
    disabledTabs.current.delete(val);
  }, []);

  const focusTabByIndex = useCallback((index: number) => {
    const order = tabOrder.current;
    const enabledOrder = order.filter((item) => !disabledTabs.current.get(item));
    if (!enabledOrder.length) return;
    const boundedIndex = (index + enabledOrder.length) % enabledOrder.length;
    const valueAtIndex = enabledOrder[boundedIndex];
    const ref = tabRefs.current.get(valueAtIndex);
    if (ref?.current) {
      ref.current.focus();
      setFocusedValue(valueAtIndex);
      if (activationMode === 'automatic') {
        setActiveValue(valueAtIndex);
      }
    }
  }, [activationMode, setActiveValue]);

  const getEnabledIndex = useCallback((val: string) => {
    const enabledOrder = tabOrder.current.filter(
      (item) => !disabledTabs.current.get(item)
    );
    return enabledOrder.indexOf(val);
  }, []);

  const focusNext = useCallback(
    (current: string) => {
      const index = getEnabledIndex(current);
      focusTabByIndex(index + 1);
    },
    [focusTabByIndex, getEnabledIndex]
  );

  const focusPrevious = useCallback(
    (current: string) => {
      const index = getEnabledIndex(current);
      focusTabByIndex(index - 1);
    },
    [focusTabByIndex, getEnabledIndex]
  );

  const focusFirst = useCallback(() => {
    focusTabByIndex(0);
  }, [focusTabByIndex]);

  const focusLast = useCallback(() => {
    const enabledOrder = tabOrder.current.filter(
      (item) => !disabledTabs.current.get(item)
    );
    focusTabByIndex(enabledOrder.length - 1);
  }, [focusTabByIndex]);

  const isTabDisabled = useCallback((val: string) => {
    return Boolean(disabledTabs.current.get(val));
  }, []);

  const registerDisabledTab = useCallback((val: string, disabled: boolean) => {
    disabledTabs.current.set(val, disabled);
  }, []);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      activeValue,
      setActiveValue,
      focusedValue,
      setFocusedValue,
      orientation,
      activationMode,
      registerTab,
      unregisterTab,
      focusNext,
      focusPrevious,
      focusFirst,
      focusLast,
      isTabDisabled,
      registerDisabledTab,
    }),
    [
      activationMode,
      activeValue,
      focusFirst,
      focusLast,
      focusNext,
      focusPrevious,
      focusedValue,
      isTabDisabled,
      orientation,
      registerDisabledTab,
      registerTab,
      setActiveValue,
      setFocusedValue,
      unregisterTab,
    ]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, children, ...props }: TabsListProps) {
  const { orientation } = useTabsContext('TabsList');

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal'
          ? 'inline-flex h-10 items-center justify-start gap-1 rounded-md bg-muted p-1'
          : 'flex w-full flex-col items-stretch gap-1 rounded-md bg-muted p-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  disabled = false,
  children,
  ...props
}: TabsTriggerProps) {
  const {
    activeValue,
    setActiveValue,
    focusedValue,
    setFocusedValue,
    orientation,
    activationMode,
    registerTab,
    unregisterTab,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    registerDisabledTab,
  } = useTabsContext('TabsTrigger');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const sanitizedValue = value.replace(/\s+/g, '-').toLowerCase();
  const triggerId = `tabs-${sanitizedValue}-trigger`;
  const panelId = `tabs-${sanitizedValue}-content`;

  useEffect(() => {
    registerDisabledTab(value, disabled);
  }, [disabled, registerDisabledTab, value]);

  useEffect(() => {
    registerTab(value, triggerRef);
    return () => unregisterTab(value);
  }, [registerTab, unregisterTab, value]);

  useEffect(() => {
    if (disabled && activeValue === value) {
      focusNext(value);
    }
  }, [activeValue, disabled, focusNext, value]);

  const handleActivation = () => {
    if (disabled) return;
    setActiveValue(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const horizontal = orientation === 'horizontal';
    const dir =
      typeof document !== 'undefined'
        ? (document.documentElement?.dir ||
            document.body?.dir ||
            'ltr')
        : 'ltr';
    const isRtl = horizontal && dir.toLowerCase() === 'rtl';
    switch (event.key) {
      case 'ArrowRight':
        if (!horizontal) return;
        event.preventDefault();
        if (isRtl) {
          focusPrevious(value);
        } else {
          focusNext(value);
        }
        break;
      case 'ArrowLeft':
        if (!horizontal) return;
        event.preventDefault();
        if (isRtl) {
          focusNext(value);
        } else {
          focusPrevious(value);
        }
        break;
      case 'ArrowDown':
        if (horizontal) return;
        event.preventDefault();
        focusNext(value);
        break;
      case 'ArrowUp':
        if (horizontal) return;
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
        handleActivation();
        break;
      default:
        break;
    }
  };

  const isActive = activeValue === value;
  const isFocused = focusedValue === value;

  return (
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isFocused ? 0 : -1}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all motion-safe:transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className
      )}
      onClick={(event) => {
        props.onClick?.(event);
        handleActivation();
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        handleKeyDown(event);
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        setFocusedValue(value);
        if (activationMode === 'automatic' && !disabled) {
          setActiveValue(value);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { activeValue } = useTabsContext('TabsContent');
  const sanitizedValue = value.replace(/\s+/g, '-').toLowerCase();
  const contentId = `tabs-${sanitizedValue}-content`;
  const triggerId = `tabs-${sanitizedValue}-trigger`;
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      aria-labelledby={triggerId}
      id={contentId}
      tabIndex={0}
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive}
      className={cn(
        'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:animate-fade-in',
        className
      )}
      {...props}
    >
      {isActive && children}
    </div>
  );
}
