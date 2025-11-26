'use client';

import { useTranslations } from 'next-intl';
import type { SortOption } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  Icon,
} from '@/components/ui';

export interface ProductSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = ['bestSelling', 'highestRated', 'lowestPrice', 'highestPrice', 'newest'];

export function ProductSort({ value, onChange }: ProductSortProps) {
  const t = useTranslations('plp.sort');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="md">
          <span>{t('label')}: {t(value)}</span>
          <Icon name="chevron-down" className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={value === option ? 'bg-sand-100 dark:bg-sand-800' : ''}
          >
            {t(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
