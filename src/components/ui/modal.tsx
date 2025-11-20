'use client';

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Icon } from './icon';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalContextValue {
  titleId: string;
  descriptionId?: string;
  close: () => void;
  title: string;
  description?: string;
  showCloseButton: boolean;
  variant: 'default' | 'glass';
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(component: string) {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(`${component} must be used within a Modal component.`);
  }

  return context;
}

export interface ModalProps
  extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'onClose' | 'children'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  variant?: 'default' | 'glass';
  children: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] min-h-[calc(100vh-2rem)]',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  variant = 'default',
  className,
  children,
  ...props
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);  const supportsShowModalRef = useRef<boolean>(true);
  const titleId = useId();
  const descriptionIdGenerated = useId();
  const descriptionId = description ? descriptionIdGenerated : undefined;

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.dataset.state = open ? 'open' : 'closed';

    if (open) {
      previouslyFocusedElement.current =
        (document.activeElement as HTMLElement) ?? null;

      if (!dialog.open && !dialog.hasAttribute('open')) {
        const canShowModal = typeof dialog.showModal === 'function';
        if (canShowModal) {
          try {
            dialog.showModal();
            supportsShowModalRef.current = true;
          } catch {
            supportsShowModalRef.current = false;
            dialog.setAttribute('open', '');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
          }
        } else {
          supportsShowModalRef.current = false;
          dialog.setAttribute('open', '');
          dialog.setAttribute('role', 'dialog');
          dialog.setAttribute('aria-modal', 'true');
        }
      }

      requestAnimationFrame(() => {
        const focusable =
          dialog.querySelector<HTMLElement>(
            '[data-autofocus], button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? dialog;
        focusable.focus();
      });
    } else {
      if (supportsShowModalRef.current) {
        if (dialog.open) {
          dialog.close();
        }
      } else {
        dialog.removeAttribute('open');
        dialog.removeAttribute('role');
        dialog.removeAttribute('aria-modal');
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.dataset.state = 'closed';
      if (open) {
        onOpenChange(false);
      }
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus({ preventScroll: true });
      }
      previouslyFocusedElement.current = null;
      if (!supportsShowModalRef.current) {
        dialog.removeAttribute('open');
        dialog.removeAttribute('role');
        dialog.removeAttribute('aria-modal');
      }
    };

    const handleCancel = (event: Event) => {
      if (!closeOnEscape) {
        event.preventDefault();
      }
    };

    const handleBackdropClick = (event: MouseEvent) => {
      if (!closeOnBackdrop) return;
      if (event.target === dialog) {
        dialog.close();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [closeOnBackdrop, closeOnEscape, onOpenChange, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open || supportsShowModalRef.current) return;

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          '[data-autofocus], button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getAttribute('tabindex') !== '-1'
      );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (!active || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const hasCustomHeader = useMemo(() => {
    let found = false;
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === ModalHeader) {
        found = true;
      }
    });
    return found;
  }, [children]);

  const contextValue = useMemo<ModalContextValue>(
    () => ({
      titleId,
      descriptionId,
      close,
      title,
      description,
      showCloseButton,
      variant,
    }),
    [close, description, descriptionId, showCloseButton, title, titleId, variant]
  );

  const dialogBaseClasses =
    'fixed inset-0 z-50 m-auto w-full max-h-[calc(100vh-2rem)] overflow-hidden rounded-lg border p-0 transition-[transform,opacity] motion-safe:duration-200 data-[state=open]:animate-fade-in';

  const variantClasses =
    variant === 'glass'
      ? 'glass-overlay border-white/20 bg-transparent shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-md'
      : 'border-border bg-background shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm';

  return (
    <ModalContext.Provider value={contextValue}>
      <dialog
        ref={dialogRef}
        className={cn(
          dialogBaseClasses,
          variantClasses,
          sizeClasses[size],
          className
        )}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        {...props}
      >
        <div className="flex max-h-full flex-col">
          {!hasCustomHeader && <ModalHeader />}
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </dialog>
    </ModalContext.Provider>
  );
}

export function ModalHeader({
  className,
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const {
    title,
    description,
    titleId,
    descriptionId,
    close,
    showCloseButton,
    variant,
  } = useModalContext('ModalHeader');

  const headerClasses = cn(
    'flex items-start justify-between gap-4 p-6',
    variant === 'glass'
      ? 'border-b border-white/20 bg-white/20 backdrop-blur backdrop-saturate-150 dark:bg-black/20'
      : 'border-b border-border',
    className
  );

  return (
    <div
      className={headerClasses}
      style={style}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <h2 id={titleId} className="text-xl font-semibold leading-snug">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
      {showCloseButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ms-auto rounded-full p-2 glass-focus"
          onClick={close}
          aria-label="Close dialog"
        >
          <Icon name="close" size="sm" />
        </Button>
      )}
    </div>
  );
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-6 text-sm text-foreground',
        className
      )}
      {...props}
    />
  );
}

export function ModalFooter({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { variant } = useModalContext('ModalFooter');

  const footerClasses = cn(
    'flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:pt-0',
    variant === 'glass'
      ? 'border-t border-white/20 bg-white/15 backdrop-blur backdrop-saturate-150 dark:bg-black/25'
      : 'border-t border-border',
    className
  );

  return (
    <div
      className={footerClasses}
      style={style}
      {...props}
    />
  );
}
