'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AuthUser } from '@server/auth';
import { useTranslations } from 'next-intl';

import { Badge, Button, Icon, Input } from '@/components/ui';
import type { SavedAddress, ShippingAddressSnapshot } from '@/types';

import { GOVERNORATES } from '@/data/governorates';
import { cn } from '@/lib/utils';
import { validateShippingInfo } from '@/lib/checkout/validation';

type Mode = 'select' | 'new';

interface ShippingInfoContinuePayload {
  shippingAddress: ShippingAddressSnapshot;
  guestEmail?: string | null;
  saveAddress?: boolean;
  shippingAddressId?: string | null;
}

export interface ShippingInfoStepProps {
  user: AuthUser | null;
  savedAddresses: SavedAddress[];
  initialData?: ShippingAddressSnapshot | null;
  initialGuestEmail?: string | null;
  initialSaveAddress?: boolean;
  selectedAddressId?: string | null;
  onContinue: (payload: ShippingInfoContinuePayload) => void;
  className?: string;
}

const EMPTY_ADDRESS: ShippingAddressSnapshot = {
  label: '',
  recipient_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  governorate: GOVERNORATES[0],
  postal_code: '',
};

function savedAddressToSnapshot(address: SavedAddress): ShippingAddressSnapshot {
  return {
    label: address.label ?? '',
    recipient_name: address.recipient_name,
    phone: address.phone ?? '',
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? '',
    city: address.city,
    governorate: address.governorate,
    postal_code: address.postal_code ?? '',
  };
}

export function ShippingInfoStep({
  user,
  savedAddresses,
  initialData,
  initialGuestEmail,
  initialSaveAddress = false,
  selectedAddressId: selectedAddressIdProp,
  onContinue,
  className,
}: ShippingInfoStepProps) {
  const t = useTranslations('checkout.shipping');
  const tAccount = useTranslations('account.addresses');
  const translate = useTranslations();

  const defaultAddress = useMemo(() => {
    if (!savedAddresses.length) {
      return null;
    }
    return (
      savedAddresses.find((address) => address.is_default) ?? savedAddresses[0]
    );
  }, [savedAddresses]);

  const [mode, setMode] = useState<Mode>(() => {
    if (!user || savedAddresses.length === 0) {
      return 'new';
    }
    if (selectedAddressIdProp) {
      return 'select';
    }
    return initialData ? 'new' : 'select';
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    selectedAddressIdProp ?? defaultAddress?.id ?? null
  );
  const [newAddress, setNewAddress] = useState<ShippingAddressSnapshot>(
    initialData ?? EMPTY_ADDRESS
  );
  const [guestEmail, setGuestEmail] = useState(initialGuestEmail ?? '');
  const [saveAddress, setSaveAddress] = useState(initialSaveAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isGuest = !user;

  const handleModeChange = useCallback(
    (nextMode: Mode) => {
      setMode(nextMode);
      setErrors({});
      if (nextMode === 'select' && !selectedAddressId && defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    },
    [defaultAddress, selectedAddressId]
  );

  const handleAddressFieldChange = useCallback(
    (field: keyof ShippingAddressSnapshot, value: string) => {
      setNewAddress((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      const addressFields: Array<keyof ShippingAddressSnapshot> = [
        'recipient_name',
        'address_line1',
        'address_line2',
        'city',
        'governorate',
        'label',
        'postal_code',
      ];
      if (errors.address && addressFields.includes(field)) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.address;
          return next;
        });
      }
    },
    [errors]
  );

  const handleContinue = useCallback(() => {
    if (mode === 'select') {
      const address = savedAddresses.find((item) => item.id === selectedAddressId);
      if (!address) {
        setErrors({ address: 'checkout.validation.addressRequired' });
        return;
      }

      onContinue({
        shippingAddress: savedAddressToSnapshot(address),
        guestEmail: isGuest ? guestEmail : null,
        shippingAddressId: address.id,
        saveAddress: false,
      });
      return;
    }

    const validation = validateShippingInfo(newAddress, guestEmail, isGuest);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onContinue({
      shippingAddress: newAddress,
      guestEmail: isGuest ? guestEmail : null,
      saveAddress: user ? saveAddress : undefined,
    });
  }, [
    mode,
    savedAddresses,
    selectedAddressId,
    guestEmail,
    isGuest,
    newAddress,
    onContinue,
    saveAddress,
    user,
  ]);

  const addressErrorMessage = errors.address
    ? translate(errors.address)
    : undefined;
  const phoneErrorMessage = errors.phone ? translate(errors.phone) : undefined;
  const emailErrorMessage = errors.email ? translate(errors.email) : undefined;

  return (
    <section className={cn('space-y-6', className)}>
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>

      {user && savedAddresses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === 'select' ? 'primary' : 'outline'}
            onClick={() => handleModeChange('select')}
          >
            {t('useExisting')}
          </Button>
          <Button
            type="button"
            variant={mode === 'new' ? 'primary' : 'outline'}
            onClick={() => handleModeChange('new')}
          >
            {t('addNew')}
          </Button>
        </div>
      )}

      {mode === 'select' && user && savedAddresses.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {savedAddresses.map((address) => {
              const isSelected = address.id === selectedAddressId;
              return (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => setSelectedAddressId(address.id)}
                  className={cn(
                    'flex h-full flex-col rounded-lg border p-4 text-start transition-colors motion-safe:transition-colors',
                    isSelected
                      ? 'border-aqua-500 bg-aqua-50 dark:bg-aqua-950/20'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {address.label ?? tAccount('unknownLabel')}
                    </span>
                    {address.is_default && (
                      <Badge variant="success">{tAccount('default')}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground">
                    {address.recipient_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.address_line1}
                  </p>
                  {address.address_line2 && (
                    <p className="text-sm text-muted-foreground">
                      {address.address_line2}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.governorate}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-muted-foreground">
                      {address.phone}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          {addressErrorMessage && (
            <p className="text-sm text-coral-500">{addressErrorMessage}</p>
          )}
        </div>
      )}

      {mode === 'new' && (
        <div className="space-y-4">
          {isGuest && (
            <Input
              type="email"
              label={t('guestEmail')}
              placeholder="name@example.com"
              value={guestEmail}
              onChange={(event) => {
                setGuestEmail(event.target.value);
                if (errors.email) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              helperText={t('guestEmailHint')}
              error={emailErrorMessage}
            />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={tAccount('label')}
              value={newAddress.label ?? ''}
              onChange={(event) => handleAddressFieldChange('label', event.target.value)}
            />
            <Input
              label={tAccount('recipientName')}
              value={newAddress.recipient_name}
              onChange={(event) =>
                handleAddressFieldChange('recipient_name', event.target.value)
              }
              error={addressErrorMessage}
            />
          </div>

          <Input
            label={tAccount('addressLine1')}
            value={newAddress.address_line1}
            onChange={(event) =>
              handleAddressFieldChange('address_line1', event.target.value)
            }
            error={addressErrorMessage}
          />

          <Input
            label={tAccount('addressLine2')}
            value={newAddress.address_line2 ?? ''}
            onChange={(event) =>
              handleAddressFieldChange('address_line2', event.target.value)
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={tAccount('city')}
              value={newAddress.city}
              onChange={(event) => handleAddressFieldChange('city', event.target.value)}
              error={addressErrorMessage}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {tAccount('governorate')}
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={newAddress.governorate}
                onChange={(event) =>
                  handleAddressFieldChange('governorate', event.target.value)
                }
              >
                {GOVERNORATES.map((governorate) => (
                  <option key={governorate} value={governorate}>
                    {governorate}
                  </option>
                ))}
              </select>
              {addressErrorMessage && (
                <p className="text-sm text-coral-500">{addressErrorMessage}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={tAccount('postalCode')}
              value={newAddress.postal_code ?? ''}
              onChange={(event) =>
                handleAddressFieldChange('postal_code', event.target.value)
              }
            />
            <Input
              label={tAccount('phone')}
              value={newAddress.phone ?? ''}
              onChange={(event) => handleAddressFieldChange('phone', event.target.value)}
              error={phoneErrorMessage}
              placeholder="+9647XXXXXXXXX"
            />
          </div>

          {user && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
              />
              {t('saveAddress')}
            </label>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="sm:w-auto"
          onClick={handleContinue}
        >
          <span>{t('continue')}</span>
          <Icon name="arrow-right" className="ms-2 h-4 w-4" flipRtl />
        </Button>
      </div>
    </section>
  );
}
