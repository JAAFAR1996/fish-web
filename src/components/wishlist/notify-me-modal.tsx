'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import {
  Button,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import { createNotifyMeRequestAction } from '@/lib/wishlist/wishlist-actions';
import { validateEmail } from '@/lib/auth/validation';
import type { Product } from '@/types';

export interface NotifyMeModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function NotifyMeModal({ product, isOpen, onClose }: NotifyMeModalProps) {
  const t = useTranslations('wishlist.notifyMe');
  const tActions = useTranslations('wishlist.actions');
  const translate = useTranslations();
  const { user } = useAuth();

  const defaultEmail = user?.email ?? '';
  const [email, setEmail] = useState(defaultEmail);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail, isOpen]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);

    return () => clearTimeout(timer);
  }, [isSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setErrorKey(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }

    try {
      return translate(errorKey);
    } catch (error) {
      console.error('Failed to translate error key', error);
      return translate('wishlist.notifyMe.error');
    }
  }, [errorKey, translate]);

  const handleClose = () => {
    if (isPending) {
      return;
    }
    onClose();
  };

  const handleSubmit = () => {
    setErrorKey(null);

    const targetEmail = user ? user.email ?? '' : email.trim();

    if (!user) {
      const validation = validateEmail(targetEmail);
      if (!validation.valid) {
        setErrorKey(validation.errors.email ?? 'wishlist.notifyMe.error');
        return;
      }
    }

    startTransition(async () => {
      const response = await createNotifyMeRequestAction(
        product.id,
        user ? undefined : targetEmail
      );

      if (!response.success) {
        setErrorKey(response.error ?? 'wishlist.notifyMe.error');
        return;
      }

      setIsSuccess(true);
    });
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)} size="sm" title={t('title')}>
      <ModalHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aqua-500/10 text-aqua-500">
            <Icon name="bell" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={product.thumbnail || product.images[0] || '/images/placeholder.png'}
              alt={product.name}
              fill
              sizes="56px"
              className="object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-2">
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          </div>
        </div>

        <Input
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={Boolean(user)}
          error={Boolean(errorMessage)}
          helperText={errorMessage ?? undefined}
        />

        {isSuccess && (
          <div className="flex items-center gap-2 rounded-md border border-aqua-500 bg-aqua-50 px-3 py-2 text-sm text-aqua-600">
            <Icon name="check" size="sm" aria-hidden="true" />
            <span>{t('success')}</span>
          </div>
        )}
      </ModalBody>
      <ModalFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="sm:min-w-[120px]"
          onClick={handleClose}
          disabled={isPending}
        >
          {tActions('cancel')}
        </Button>
        <Button
          type="button"
          variant="primary"
          className="sm:min-w-[160px]"
          onClick={handleSubmit}
          loading={isPending}
          disabled={isSuccess}
        >
          {t('submit')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
