'use client';

import { useEffect, useState, useTransition } from 'react';
import type { AuthUser } from '@server/auth';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import type { SavedAddress } from '@/types';
import { AddressForm, type AddressFormValues } from './address-form';
import {
  deleteAddressAction,
  listAddressesAction,
  saveAddressAction,
  setDefaultAddressAction,
} from '@/lib/account/address-actions';

interface AddressesSectionProps {
  user: AuthUser;
}

export function AddressesSection({ user }: AddressesSectionProps) {
  const t = useTranslations('account.addresses');
  const tAuth = useTranslations('auth');

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<SavedAddress | null>(null);
  const [saving, startSaving] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await listAddressesAction();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses', err);
      setError('auth.errors.unknownError');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSaveAddress = async (values: AddressFormValues) => {
    startSaving(async () => {
      const result = await saveAddressAction(values, currentAddress?.id);
      if (!result.success) {
        setError(result.error ?? 'auth.errors.unknownError');
        return;
      }

      await fetchAddresses();
      setFormOpen(false);
      setCurrentAddress(null);
    });
  };

  const handleDeleteAddress = async (id: string) => {
    startSaving(async () => {
      const result = await deleteAddressAction(id);
      if (!result.success) {
        setError(result.error ?? 'auth.errors.unknownError');
        return;
      }

      setConfirmDeleteId(null);
      await fetchAddresses();
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setCurrentAddress(null);
            setFormOpen(true);
          }}
        >
          <Icon name="plus" size="sm" className="me-2" />
          {t('addNew')}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {tAuth(error.replace('auth.', ''))}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {t('loading')}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center">
          <Icon name="home" size="lg" className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('noAddresses')}</p>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentAddress(null);
              setFormOpen(true);
            }}
          >
            {t('addNew')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="flex h-full flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {address.label || t('unknownLabel')}
                    {address.is_default && (
                      <Badge variant="info">{t('default')}</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {address.recipient_name}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">{address.phone}</div>
                <div className="text-muted-foreground">
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ''}
                </div>
                <div className="text-muted-foreground">
                  {address.city}, {address.governorate}
                </div>
                {address.postal_code && (
                  <div className="text-muted-foreground">{address.postal_code}</div>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentAddress(address);
                    setFormOpen(true);
                  }}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(address.id)}
                  className="text-destructive"
                >
                  {t('delete')}
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      startSaving(async () => {
                        const result = await setDefaultAddressAction(address.id);
                        if (!result.success) {
                          setError(result.error ?? 'auth.errors.unknownError');
                          return;
                        }

                        await fetchAddresses();
                      });
                    }}
                    disabled={saving}
                  >
                    {t('setDefault')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setCurrentAddress(null);
          }
        }}
        title={
          currentAddress ? t('editAddressTitle') : t('addAddressTitle')
        }
      >
        <ModalBody>
          <AddressForm
            initialValues={currentAddress ?? undefined}
            onSubmit={handleSaveAddress}
            onCancel={() => {
              setFormOpen(false);
              setCurrentAddress(null);
            }}
            isLoading={saving}
          />
        </ModalBody>
      </Modal>

      <Modal
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title={t('delete')}
      >
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            {t('deleteConfirm')}
          </p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmDeleteId(null)}
            disabled={saving}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => confirmDeleteId && handleDeleteAddress(confirmDeleteId)}
            loading={saving}
          >
            {t('delete')}
          </Button>
        </ModalFooter>
      </Modal>
    </section>
  );
}
