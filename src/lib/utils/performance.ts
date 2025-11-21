import { FEATURES } from '@/lib/config/features';

type AnyFunction = (...args: unknown[]) => unknown;

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface DebounceOptions {
  leading?: boolean;
  maxWait?: number;
}

export type WillChangeProperties =
  | 'transform'
  | 'opacity'
  | 'filter'
  | 'backdrop-filter'
  | 'box-shadow'
  | 'background'
  | (string & {});

type ThrottledFunction<T extends AnyFunction> = ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
  cancel: () => void;
};

type DebouncedFunction<T extends AnyFunction> = ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const throttle = <T extends AnyFunction>(
  callback: T,
  delay = 100,
  options: ThrottleOptions = {},
): ThrottledFunction<T> => {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: unknown;

  const invoke = (time: number): ReturnType<T> => {
    lastCallTime = time;
    const args = lastArgs;
    const context = lastContext;
    lastArgs = null;
    lastContext = undefined;
    timeoutId = null;
    return callback.apply(context, args ?? []);
  };

  const startTrailing = (remaining: number): void => {
    if (!trailing || timeoutId != null) {
      return;
    }

    timeoutId = setTimeout(() => {
      const time = now();
      invoke(time);
    }, remaining);
  };

  const throttled: ThrottledFunction<T> = function throttledFn(
    this: unknown,
    ...args: Parameters<T>
  ) {
    const currentTime = now();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (lastCallTime === 0 && !leading) {
      lastCallTime = currentTime;
    }

    const remaining = delay - (currentTime - lastCallTime);
    lastArgs = args;
    lastContext = context;

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return invoke(currentTime);
    }

    startTrailing(remaining);
    return undefined as ReturnType<T>;
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = null;
    lastArgs = null;
    lastContext = undefined;
    lastCallTime = 0;
  };

  return throttled;
};

export const debounce = <T extends AnyFunction>(
  callback: T,
  delay = 100,
  options: DebounceOptions = {},
): DebouncedFunction<T> => {
  const { leading = false, maxWait } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxWaitId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: unknown;
  let lastInvokeTime = 0;
  let result: ReturnType<T> | undefined;

  const clearTimers = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxWaitId) {
      clearTimeout(maxWaitId);
      maxWaitId = null;
    }
  };

  const invoke = (): ReturnType<T> => {
    lastInvokeTime = now();
    const args = lastArgs;
    const context = lastContext;
    lastArgs = null;
    lastContext = undefined;
    clearTimers();
    const value = callback.apply(context, args ?? []) as ReturnType<T>;
    result = value;
    return value;
  };

  const debounced: DebouncedFunction<T> = function debouncedFn(
    this: unknown,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    lastArgs = args;
    lastContext = context;

    const shouldCallNow = leading && timeoutId == null;

    if (maxWait != null && maxWait > 0) {
      const timeSinceLastInvoke = now() - lastInvokeTime;
      if (timeSinceLastInvoke >= maxWait) {
        return invoke();
      }
      if (maxWaitId == null) {
        maxWaitId = setTimeout(() => {
          maxWaitId = null;
          if (timeoutId == null) {
            invoke();
          }
        }, maxWait - timeSinceLastInvoke);
      }
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!leading || lastArgs != null) {
        invoke();
      }
    }, delay);

    return shouldCallNow ? invoke() : result;
  };

  debounced.cancel = () => {
    clearTimers();
    lastArgs = null;
    lastContext = undefined;
  };

  debounced.flush = () => {
    if (timeoutId != null) {
      return invoke();
    }
    return result;
  };

  return debounced;
};

export const rafThrottle = <T extends AnyFunction>(callback: T): ThrottledFunction<T> => {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return throttle(callback, 16);
  }

  let frameId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: unknown;

  const invoke = () => {
    frameId = null;
    const args = lastArgs;
    const context = lastContext;
    lastArgs = null;
    lastContext = undefined;
    if (args) {
      callback.apply(context, args);
    }
  };

  const throttled: ThrottledFunction<T> = function throttledFn(
    this: unknown,
    ...args: Parameters<T>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    lastArgs = args;
    lastContext = context;
    if (frameId == null) {
      frameId = window.requestAnimationFrame(invoke);
    }
    return undefined as ReturnType<T>;
  };

  throttled.cancel = () => {
    if (frameId != null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(frameId);
    }
    frameId = null;
    lastArgs = null;
    lastContext = undefined;
  };

  return throttled;
};

type WillChangeEntry = {
  properties: Set<string>;
  timers: Set<ReturnType<typeof setTimeout>>;
};

const willChangeMap = new WeakMap<HTMLElement, WillChangeEntry>();

const ensureEntry = (element: HTMLElement): WillChangeEntry => {
  let entry = willChangeMap.get(element);
  if (!entry) {
    entry = { properties: new Set(), timers: new Set() };
    willChangeMap.set(element, entry);
  }
  return entry;
};

const updateWillChangeStyle = (element: HTMLElement, entry: WillChangeEntry): void => {
  if (entry.properties.size === 0) {
    element.style.willChange = '';
    willChangeMap.delete(element);
    return;
  }

  element.style.willChange = Array.from(entry.properties).join(', ');
};

export const willChangeManager = {
  add(element: HTMLElement | null, properties: WillChangeProperties[]): void {
    if (!element || properties.length === 0) {
      return;
    }

    const entry = ensureEntry(element);
    properties.forEach((property) => entry.properties.add(property));
    updateWillChangeStyle(element, entry);
  },

  remove(element: HTMLElement | null): void {
    if (!element) {
      return;
    }

    const entry = willChangeMap.get(element);
    if (!entry) {
      return;
    }

    entry.timers.forEach((timer) => clearTimeout(timer));
    entry.properties.clear();
    entry.timers.clear();
    element.style.willChange = '';
    willChangeMap.delete(element);
  },

  auto(element: HTMLElement | null, properties: WillChangeProperties[], duration: number): void {
    if (!element || properties.length === 0) {
      return;
    }

    this.add(element, properties);

    if (duration <= 0) {
      return;
    }

    const entry = ensureEntry(element);
    const timer = setTimeout(() => {
      properties.forEach((property) => entry.properties.delete(property));
      updateWillChangeStyle(element, entry);
      entry.timers.delete(timer);
    }, duration);

    entry.timers.add(timer);
  },
};

const performanceMarks = new Map<string, number>();

export const performanceMonitor = {
  start(label: string): void {
    if (!FEATURES.debugAnimations || typeof performance === 'undefined') {
      return;
    }

    performanceMarks.set(label, performance.now());
  },

  end(label: string): void {
    if (!FEATURES.debugAnimations || typeof performance === 'undefined') {
      return;
    }

    const startTime = performanceMarks.get(label);
    if (startTime == null) {
      return;
    }

    const duration = performance.now() - startTime;
    performanceMarks.delete(label);

    // eslint-disable-next-line no-console
    console.info(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  },
};
