'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => unknown;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
  pagination?: boolean;
  itemsPerPage?: number;
  searchQuery?: string;
  className?: string;
}

const getComparableValue = (value: unknown): string | number => {
  if (value == null) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  if (value instanceof Date) return value.getTime();
  return String(value).toLowerCase();
};

export function AdminDataTable<T>({
  data,
  columns,
  onRowClick,
  pagination = true,
  itemsPerPage = 20,
  searchQuery,
  className,
}: AdminDataTableProps<T>) {
  const t = useTranslations('admin');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  const filteredData = useMemo(() => {
    if (!searchQuery?.trim()) {
      return data;
    }

    const term = searchQuery.trim().toLowerCase();

    return data.filter((item) =>
      columns.some((column) => {
        const value = column.accessor ? column.accessor(item) : (item as Record<string, unknown>)[column.key];
        return String(value ?? '')
          .toLowerCase()
          .includes(term);
      }),
    );
  }, [columns, data, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortColumn) {
      return filteredData;
    }

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || !column.sortable) {
      return filteredData;
    }

    const accessor =
      column.accessor ??
      ((item: T) => (item as Record<string, unknown>)[column.key]);

    const sorted = [...filteredData].sort((a, b) => {
      const valueA = getComparableValue(accessor(a));
      const valueB = getComparableValue(accessor(b));

      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [columns, filteredData, sortColumn, sortDirection]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(sortedData.length / itemsPerPage))
    : 1;

  const paginatedData = useMemo(() => {
    if (!pagination) {
      return sortedData;
    }

    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, pagination, sortedData]);

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-3 font-medium',
                    column.sortable && 'cursor-pointer select-none',
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <Icon
                        name={
                          sortColumn === column.key
                            ? sortDirection === 'asc'
                              ? 'arrow-up'
                              : 'arrow-down'
                            : 'chevrons-up-down'
                        }
                        className="h-3.5 w-3.5 text-muted-foreground"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  {t('common.noResults')}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/40',
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                    const content = column.render
                      ? column.render(item)
                      : column.accessor
                        ? column.accessor(item)
                        : (item as Record<string, unknown>)[column.key];

                    return (
                      <td key={column.key} className="px-4 py-3 align-middle">
                        {typeof content === 'string' || typeof content === 'number'
                          ? (
                            <span>{content}</span>
                            )
                          : (content as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            {paginatedData.length} {t('common.rows')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <Icon name="arrow-left" className="h-4 w-4" />
              {t('common.previous')}
            </Button>
            <span className="text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
              <Icon name="arrow-right" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
