'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalHeader,
} from '@/components/ui';
import {
  FilterCalculator,
  HeaterCalculator,
} from '@/components/calculators';
import type { CartItemWithProduct, CalculatorType } from '@/types';
import { cn } from '@/lib/utils';

export type CalculatorLinkProps = {
  cartItems: CartItemWithProduct[];
  variant?: 'link' | 'button';
  className?: string;
};

export function CalculatorLink({
  cartItems,
  variant = 'link',
  className,
}: CalculatorLinkProps) {
  const t = useTranslations('cart.calculator');
  const [open, setOpen] = useState(false);

  const calculatorType: CalculatorType = useMemo(() => {
    const hasHeating = cartItems.some(
      (item) => item.product.category === 'heating'
    );
    const hasFilter = cartItems.some(
      (item) => item.product.category === 'filtration'
    );
    if (hasHeating) return 'heater';
    if (hasFilter) return 'filter';
    return 'heater';
  }, [cartItems]);

  if (variant === 'button') {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('inline-flex items-center gap-2', className)}
          onClick={() => setOpen(true)}
        >
          <Icon name="calculator" size="sm" />
          {t('useCalculator')}
        </Button>
        <CalculatorModal
          open={open}
          onOpenChange={setOpen}
          calculatorType={calculatorType}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium text-aqua-600 hover:text-aqua-500',
          className
        )}
      >
        <Icon name="help" size="sm" />
        {t('needHelp')}
      </button>
      <CalculatorModal
        open={open}
        onOpenChange={setOpen}
        calculatorType={calculatorType}
      />
    </>
  );
}

type CalculatorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculatorType: CalculatorType;
};

function CalculatorModal({
  open,
  onOpenChange,
  calculatorType,
}: CalculatorModalProps) {
  const t = useTranslations('cart.calculator');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('calculateSize')}
      size="lg"
    >
      <ModalHeader />
      <ModalBody className="space-y-4">
        {calculatorType === 'heater' ? (
          <HeaterCalculator canSave={false} />
        ) : (
          <FilterCalculator canSave={false} />
        )}
      </ModalBody>
    </Modal>
  );
}
