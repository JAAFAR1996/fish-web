'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Checkbox, Input } from '@/components/ui';
import type { SavedAddress } from '@/types';

const GOVERNORATES = [
  'Baghdad',
  'Basra',
  'Nineveh',
  'Erbil',
  'Sulaymaniyah',
  'Dohuk',
  'Anbar',
  'Diyala',
  'Saladin',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Wasit',
  'Maysan',
  'Dhi Qar',
  'Muthanna',
  'Qadisiyyah',
  'Babil',
] as const;

export type AddressFormValues = Omit<
  SavedAddress,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

interface AddressFormProps {
  initialValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddressForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddressFormProps) {
  const t = useTranslations('account.addresses');

  const [values, setValues] = useState<AddressFormValues>({
    label: initialValues?.label ?? '',
    recipient_name: initialValues?.recipient_name ?? '',
    phone: initialValues?.phone ?? '',
    address_line1: initialValues?.address_line1 ?? '',
    address_line2: initialValues?.address_line2 ?? '',
    city: initialValues?.city ?? '',
    governorate: initialValues?.governorate ?? GOVERNORATES[0],
    postal_code: initialValues?.postal_code ?? '',
    is_default: initialValues?.is_default ?? false,
  });

  const handleChange = (field: keyof AddressFormValues, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
      <Input
        label={t('label')}
        mobileLabelInside
        value={values.label ?? ''}
        onChange={(event) => handleChange('label', event.target.value)}
        disabled={isLoading}
      />

      <Input
        label={t('recipientName')}
        mobileLabelInside
        value={values.recipient_name}
        onChange={(event) => handleChange('recipient_name', event.target.value)}
        required
        disabled={isLoading}
      />

      <Input
        label={t('phone')}
        mobileLabelInside
        placeholder="+964 7XX XXX XXXX"
        value={values.phone ?? ''}
        onChange={(event) => handleChange('phone', event.target.value)}
        required
        inputMode="tel"
        type="tel"
        disabled={isLoading}
      />

      <Input
        label={t('addressLine1')}
        mobileLabelInside
        value={values.address_line1}
        onChange={(event) => handleChange('address_line1', event.target.value)}
        required
        disabled={isLoading}
      />

      <Input
        label={t('addressLine2')}
        mobileLabelInside
        value={values.address_line2 ?? ''}
        onChange={(event) => handleChange('address_line2', event.target.value)}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('city')}
          mobileLabelInside
          value={values.city}
          onChange={(event) => handleChange('city', event.target.value)}
          required
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            {t('governorate')}
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            value={values.governorate}
            onChange={(event) => handleChange('governorate', event.target.value)}
            disabled={isLoading}
          >
            {GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label={t('postalCode')}
        mobileLabelInside
        value={values.postal_code ?? ''}
        onChange={(event) => handleChange('postal_code', event.target.value)}
        disabled={isLoading}
      />

      <div className="flex items-center gap-2">
        <Checkbox
          id="is-default"
          checked={values.is_default}
          onCheckedChange={(checked) => handleChange('is_default', Boolean(checked))}
          disabled={isLoading}
        />
        <label htmlFor="is-default" className="text-sm text-foreground">
          {t('setDefault')}
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
