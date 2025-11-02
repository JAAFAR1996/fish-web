'use client';

import { useTranslations } from 'next-intl';

import { Modal, ModalBody, type ModalProps } from '@/components/ui/modal';

import {
  CalculatorTabs,
  type CalculatorSavePayload,
} from './calculator-tabs';
import type { CalculatorType } from '@/types';

export interface CalculatorModalProps
  extends Pick<ModalProps, 'open' | 'onOpenChange'> {
  defaultTab?: CalculatorType;
  canSave?: boolean;
  onSaveCalculation?: (payload: CalculatorSavePayload) => Promise<void> | void;
}

export function CalculatorModal({
  open,
  onOpenChange,
  defaultTab,
  canSave,
  onSaveCalculation,
}: CalculatorModalProps) {
  const t = useTranslations('calculators');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      size="xl"
    >
      <ModalBody className="p-0">
        <div className="flex flex-col gap-6 p-6">
          <CalculatorTabs
            defaultTab={defaultTab}
            canSave={canSave}
            onSaveCalculation={onSaveCalculation}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}

