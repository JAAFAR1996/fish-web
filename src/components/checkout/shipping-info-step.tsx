'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import type { AuthUser } from '@server/auth';
import { useTranslations } from 'next-intl';

import { Badge, Button, Icon, Input } from '@/components/ui';
import type { SavedAddress, ShippingAddressSnapshot } from '@/types';

import { GOVERNORATES } from '@/data/governorates';
import { getCitySuggestions } from '@/data/city-suggestions';
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

function normalizePhoneInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';

  let local = digits;
  if (local.startsWith('964')) {
    local = local.slice(3);
  }
  if (local.startsWith('0')) {
    local = local.slice(1);
  }

  const trimmed = local.slice(0, 10);
  return trimmed ? `+964${trimmed}` : '';
}

export function ShippingInfoStep({
  user,
  savedAddresses,
  initialData,
  initialSaveAddress = false,
  selectedAddressId: selectedAddressIdProp,
  onContinue,
  className,
}: ShippingInfoStepProps) {
  const t = useTranslations('checkout.shipping');
  const tAccount = useTranslations('account.addresses');
  const translate = useTranslations();
  const cityListId = useId();

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
  const [saveAddress, setSaveAddress] = useState(initialSaveAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isGuest = !user;
  const citySuggestions = useMemo(
    () => getCitySuggestions(newAddress.governorate).slice(0, 6),
    [newAddress.governorate]
  );

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

  const validateFieldInline = useCallback(
    (field: keyof ShippingAddressSnapshot | 'phone') => {
      const validation = validateShippingInfo(newAddress, null, isGuest);

      setErrors((prev) => {
        const next = { ...prev };
        const fieldError = validation.errors[field];

        if (fieldError) {
          next[field] = fieldError;
        } else {
          delete next[field];
        }

        const hasAddressIssues =
          Boolean(
            validation.errors.recipient_name ||
              validation.errors.address_line1 ||
              validation.errors.city ||
              validation.errors.governorate
          );

        if (!hasAddressIssues && next.address) {
          delete next.address;
        } else if (hasAddressIssues && validation.errors.address) {
          next.address = validation.errors.address;
        }

        return next;
      });
    },
    [isGuest, newAddress]
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

  const handlePhoneChange = useCallback(
    (value: string) => {
      const normalized = normalizePhoneInput(value);
      setNewAddress((prev) => ({
        ...prev,
        phone: normalized,
      }));

      setErrors((prev) => {
        if (!prev.phone) {
          return prev;
        }
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    },
    []
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
        guestEmail: isGuest ? null : null,
        shippingAddressId: address.id,
        saveAddress: false,
      });
      return;
    }

    const validation = validateShippingInfo(newAddress, null, isGuest);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onContinue({
      shippingAddress: newAddress,
      guestEmail: isGuest ? null : null,
      saveAddress: user ? saveAddress : undefined,
    });
  }, [
    mode,
    savedAddresses,
    selectedAddressId,
    isGuest,
    newAddress,
    onContinue,
    saveAddress,
    user,
  ]);

  const translateError = useCallback(
    (key?: string) => (key ? translate(key) : undefined),
    [translate]
  );

  const addressErrorMessage = translateError(errors.address);
  const phoneErrorMessage = translateError(errors.phone);
  const recipientErrorMessage = translateError(errors.recipient_name);
  const streetErrorMessage = translateError(errors.address_line1);
  const cityErrorMessage = translateError(errors.city);
  const governorateErrorMessage = translateError(errors.governorate);
  const showGuestHint = isGuest;

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
          {showGuestHint && (
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/50 px-3 py-2">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-aqua-500/10 text-aqua-600">
                <Icon name="sparkles" size="sm" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('guestFieldsHint')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('continue')}
                </p>
              </div>
            </div>
          )}

          {isGuest ? (
            <>
              <Input
                label={tAccount('recipientName')}
                mobileLabelInside
                value={newAddress.recipient_name}
                onChange={(event) =>
                  handleAddressFieldChange('recipient_name', event.target.value)
                }
                onBlur={() => validateFieldInline('recipient_name')}
                error={recipientErrorMessage}
                autoComplete="name"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={tAccount('phone')}
                  mobileLabelInside
                  value={newAddress.phone ?? ''}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  onBlur={() => validateFieldInline('phone')}
                  error={phoneErrorMessage}
                  placeholder="+964 7XX XXX XXXX"
                  helperText={t('phoneFormatHint')}
                  inputMode="tel"
                  type="tel"
                  autoComplete="tel-national"
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
                    onBlur={() => validateFieldInline('governorate')}
                    autoComplete="address-level1"
                  >
                    {GOVERNORATES.map((governorate) => (
                      <option key={governorate} value={governorate}>
                        {governorate}
                      </option>
                    ))}
                  </select>
                  {governorateErrorMessage && (
                    <p className="text-sm text-coral-500">{governorateErrorMessage}</p>
                  )}
                </div>
              </div>

              <Input
                label={tAccount('city')}
                mobileLabelInside
                value={newAddress.city}
                onChange={(event) => handleAddressFieldChange('city', event.target.value)}
                onBlur={() => validateFieldInline('city')}
                error={cityErrorMessage}
                autoComplete="address-level2"
                list={cityListId}
              />

              <Input
                label={tAccount('addressLine1')}
                mobileLabelInside
                value={newAddress.address_line1}
                onChange={(event) =>
                  handleAddressFieldChange('address_line1', event.target.value)
                }
                onBlur={() => validateFieldInline('address_line1')}
                error={streetErrorMessage}
                placeholder={tAccount('addressLine1')}
                autoComplete="street-address"
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={tAccount('label')}
                  mobileLabelInside
                  value={newAddress.label ?? ''}
                  onChange={(event) => handleAddressFieldChange('label', event.target.value)}
                />
                <Input
                  label={tAccount('recipientName')}
                  mobileLabelInside
                  value={newAddress.recipient_name}
                  onChange={(event) =>
                    handleAddressFieldChange('recipient_name', event.target.value)
                  }
                  onBlur={() => validateFieldInline('recipient_name')}
                  error={recipientErrorMessage}
                  autoComplete="name"
                />
              </div>

              <Input
                label={tAccount('addressLine1')}
                mobileLabelInside
                value={newAddress.address_line1}
                onChange={(event) =>
                  handleAddressFieldChange('address_line1', event.target.value)
                }
                onBlur={() => validateFieldInline('address_line1')}
                error={streetErrorMessage}
                autoComplete="street-address"
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
                mobileLabelInside
                value={newAddress.city}
                onChange={(event) => handleAddressFieldChange('city', event.target.value)}
                onBlur={() => validateFieldInline('city')}
                error={cityErrorMessage}
                autoComplete="address-level2"
                list={cityListId}
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
                    onBlur={() => validateFieldInline('governorate')}
                    autoComplete="address-level1"
                  >
                    {GOVERNORATES.map((governorate) => (
                      <option key={governorate} value={governorate}>
                        {governorate}
                      </option>
                    ))}
                  </select>
                  {governorateErrorMessage && (
                    <p className="text-sm text-coral-500">{governorateErrorMessage}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={tAccount('postalCode')}
                  mobileLabelInside
                  value={newAddress.postal_code ?? ''}
                  onChange={(event) =>
                    handleAddressFieldChange('postal_code', event.target.value)
                  }
                  autoComplete="postal-code"
                />
                <Input
                  label={tAccount('phone')}
                  mobileLabelInside
                  value={newAddress.phone ?? ''}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  onBlur={() => validateFieldInline('phone')}
                  error={phoneErrorMessage}
                  placeholder="+964 7XX XXX XXXX"
                  helperText={t('phoneFormatHint')}
                  inputMode="tel"
                  type="tel"
                  autoComplete="tel-national"
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
            </>
          )}

          {citySuggestions.length > 0 && (
            <datalist id={cityListId}>
              {citySuggestions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
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
