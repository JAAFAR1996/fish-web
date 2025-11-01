'use client';

import { forwardRef } from 'react';
import { Icon } from './icon';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, label, id, className }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
              checked
                ? 'bg-aqua-600 border-aqua-600 dark:bg-aqua-500 dark:border-aqua-500'
                : 'bg-white border-sand-300 dark:bg-sand-800 dark:border-sand-600',
              !disabled && 'hover:border-aqua-500 dark:hover:border-aqua-400'
            )}
          >
            {checked && (
              <Icon
                name="check"
                className="w-3 h-3 text-white"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
        {label && (
          <span className="text-sm text-sand-900 dark:text-sand-100 select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
