'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

import {
  FilterCalculator,
  type FilterCalculatorProps,
} from './filter-calculator';
import {
  HeaterCalculator,
  type HeaterCalculatorProps,
} from './heater-calculator';
import { SalinityCalculator } from './salinity-calculator';
import type { CalculatorType } from '@/types';

type HeaterSavePayload = Parameters<
  NonNullable<HeaterCalculatorProps['onSaveCalculation']>
>[0];
type FilterSavePayload = Parameters<
  NonNullable<FilterCalculatorProps['onSaveCalculation']>
>[0];

export type CalculatorSavePayload = HeaterSavePayload | FilterSavePayload;

export interface CalculatorTabsProps {
  defaultTab?: CalculatorType;
  canSave?: boolean;
  onSaveCalculation?: (payload: CalculatorSavePayload) => Promise<void> | void;
  className?: string;
}

type TabDefinition = {
  value: CalculatorType;
  icon: IconName;
  labelKey: string;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  {
    value: 'heater',
    icon: 'thermometer',
    labelKey: 'heater',
  },
  {
    value: 'filter',
    icon: 'filter',
    labelKey: 'filter',
  },
  {
    value: 'salinity',
    icon: 'droplet',
    labelKey: 'salinity',
  },
];

function isCalculatorType(value: string): value is CalculatorType {
  return (TAB_DEFINITIONS as TabDefinition[]).some(
    (tab) => tab.value === value
  );
}

export function CalculatorTabs({
  defaultTab = 'heater',
  canSave = false,
  onSaveCalculation,
  className,
}: CalculatorTabsProps) {
  const t = useTranslations('calculators.tabs');
  const [activeTab, setActiveTab] = useState<CalculatorType>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleTabChange = useCallback((value: string) => {
    if (isCalculatorType(value)) {
      setActiveTab(value);
    }
  }, []);

  const handleSaveCalculation = useCallback(
    (payload: CalculatorSavePayload) => onSaveCalculation?.(payload),
    [onSaveCalculation]
  );

  const tabTriggers = useMemo(
    () =>
      TAB_DEFINITIONS.map(({ value, icon, labelKey }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="gap-2 px-4 py-2 text-sm font-medium sm:text-base"
        >
          <Icon name={icon} size="sm" className="text-primary" />
          <span>{t(labelKey)}</span>
        </TabsTrigger>
      )),
    [t]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn('w-full space-y-6', className)}
    >
      <TabsList className="w-full justify-start overflow-x-auto sm:justify-center">
        {tabTriggers}
      </TabsList>

      <TabsContent
        value="heater"
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <HeaterCalculator
          canSave={canSave}
          onSaveCalculation={handleSaveCalculation}
        />
      </TabsContent>

      <TabsContent
        value="filter"
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <FilterCalculator
          canSave={canSave}
          onSaveCalculation={handleSaveCalculation}
        />
      </TabsContent>

      <TabsContent
        value="salinity"
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <SalinityCalculator />
      </TabsContent>
    </Tabs>
  );
}
