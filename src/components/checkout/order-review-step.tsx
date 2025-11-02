'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { AuthUser } from '@server/auth';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Button, Checkbox, Icon } from '@/components/ui';
import { CouponInput } from './coupon-input';
import { OrderSummaryCheckout } from './order-summary-checkout';
import { createOrderAction } from '@/lib/checkout/checkout-actions';
import { useCart } from '@/components/providers/CartProvider';
import { cn, formatCurrency } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import type {
  Locale,
  PaymentMethod,
  ShippingAddressSnapshot,
} from '@/types';
import { LoyaltyPointsInput } from '@/components/marketing/loyalty-points-input';
import {
  calculatePointsDiscount,
  validatePointsRedemption,
} from '@/lib/marketing/loyalty-helpers';
import { MIN_POINTS_REDEMPTION } from '@/lib/marketing/constants';

export interface OrderReviewStepProps {
  user: AuthUser | null;
  shippingAddress: ShippingAddressSnapshot;
  paymentMethod: PaymentMethod;
  guestEmail: string | null;
  shippingCost: number;
  shippingAddressId?: string | null;
  loyaltyPointsBalance: number;
  onBack: () => void;
  onEditShipping: () => void;
  className?: string;
}

export function OrderReviewStep({
  user,
  shippingAddress,
  paymentMethod,
  guestEmail,
  shippingCost,
  shippingAddressId = null,
  loyaltyPointsBalance,
  onBack,
  onEditShipping,
  className,
}: OrderReviewStepProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const locale = useLocale();
  const resolvedLocale: Locale = locale === 'ar' ? 'ar' : 'en';

  const tReview = useTranslations('checkout.review');
  const tPayment = useTranslations('checkout.payment');
  const tSummary = useTranslations('checkout.summary');
  const tSteps = useTranslations('checkout.steps');
  const translate = useTranslations();

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorParams, setErrorParams] = useState<Record<string, string | number> | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyErrorKey, setLoyaltyErrorKey] = useState<string | null>(null);
  const [loyaltyErrorParams, setLoyaltyErrorParams] = useState<Record<string, string | number> | undefined>(undefined);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => Math.max(0, subtotal + shippingCost - discount - loyaltyDiscount),
    [discount, loyaltyDiscount, shippingCost, subtotal]
  );

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }

    try {
      return translate(errorKey, errorParams);
    } catch {
      return translate('checkout.errors.orderFailed');
    }
  }, [errorKey, errorParams, translate]);

  const loyaltyErrorMessage = useMemo(() => {
    if (!loyaltyErrorKey) {
      return null;
    }

    try {
      return translate(loyaltyErrorKey, loyaltyErrorParams);
    } catch {
      return translate('loyalty.redemptionFailed');
    }
  }, [loyaltyErrorKey, loyaltyErrorParams, translate]);

  const handleCouponApply = (code: string, amount: number) => {
    setCouponCode(code);
    setDiscount(amount);
    setErrorKey(null);
    setErrorParams(undefined);
  };

  const handleCouponRemove = () => {
    setCouponCode(null);
    setDiscount(0);
    setErrorParams(undefined);
  };

  const handleClearLoyaltyPoints = useCallback(() => {
    setLoyaltyPoints(0);
    setLoyaltyDiscount(0);
    setLoyaltyErrorKey(null);
    setLoyaltyErrorParams(undefined);
  }, []);

  const handleApplyLoyaltyPoints = useCallback(
    (points: number) => {
      if (!user) {
        handleClearLoyaltyPoints();
        setLoyaltyErrorKey('auth.errors.unauthenticated');
        setLoyaltyErrorParams(undefined);
        return;
      }

      if (points <= 0) {
        handleClearLoyaltyPoints();
        return;
      }

      const remainingSubtotal = Math.max(0, subtotal - discount);
      const validation = validatePointsRedemption(
        points,
        loyaltyPointsBalance,
        remainingSubtotal
      );

      if (!validation.valid) {
        handleClearLoyaltyPoints();
        if (validation.error === 'loyalty.minRedemption') {
          setLoyaltyErrorParams({ points: MIN_POINTS_REDEMPTION });
        } else {
          setLoyaltyErrorParams(undefined);
        }
        setLoyaltyErrorKey(validation.error ?? 'loyalty.redemptionFailed');
        return;
      }

      const computedDiscount = Math.min(
        calculatePointsDiscount(points),
        remainingSubtotal
      );

      setLoyaltyPoints(points);
      setLoyaltyDiscount(computedDiscount);
      setLoyaltyErrorKey(null);
      setLoyaltyErrorParams(undefined);
    },
    [discount, handleClearLoyaltyPoints, loyaltyPointsBalance, subtotal, user]
  );

  useEffect(() => {
    if (!user || loyaltyPoints <= 0) {
      return;
    }
    handleApplyLoyaltyPoints(loyaltyPoints);
  }, [discount, handleApplyLoyaltyPoints, loyaltyPoints, subtotal, user]);

  const handlePlaceOrder = () => {
    if (!termsAccepted) {
      setErrorKey('checkout.validation.termsRequired');
      setErrorParams(undefined);
      return;
    }

    if (items.length === 0) {
      setErrorKey('checkout.errors.emptyCart');
      setErrorParams(undefined);
      return;
    }

    setErrorKey(null);
    setErrorParams(undefined);

    startTransition(async () => {
      const guestItems = !user
        ? items.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          }))
        : undefined;

      const response = await createOrderAction({
        shippingAddress,
        paymentMethod,
        couponCode,
        notes: null,
        guestEmail,
        items: guestItems,
        locale: resolvedLocale,
        shippingAddressId,
        loyaltyPoints: loyaltyPoints > 0 ? loyaltyPoints : undefined,
      });

      if (!response.success || !response.orderNumber) {
        if (response.error && response.error.startsWith('loyalty.')) {
          setLoyaltyErrorKey(response.error);
          setLoyaltyErrorParams(response.params);
          handleClearLoyaltyPoints();
        } else {
          setErrorKey(response.error ?? 'checkout.errors.orderFailed');
          setErrorParams(response.params);
        }
        return;
      }

      setErrorKey(null);
      setErrorParams(undefined);
      await clearCart();
      router.push(`/${resolvedLocale}/checkout/confirmation?order=${response.orderNumber}`);
    });
  };

  const termsLabel = tReview.rich('termsAgree', {
    termsLink: (chunks) => (
      <Link
        href="/terms"
        className="font-medium text-aqua-600 transition-colors hover:text-aqua-500"
      >
        {chunks}
      </Link>
    ),
    privacyLink: (chunks) => (
      <Link
        href="/privacy"
        className="font-medium text-aqua-600 transition-colors hover:text-aqua-500"
      >
        {chunks}
      </Link>
    ),
  });

  return (
    <div
      className={cn(
        'grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]',
        className
      )}
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {tReview('shippingAddress')}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {shippingAddress.recipient_name}
                </p>
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.governorate}
                </p>
                {shippingAddress.postal_code && <p>{shippingAddress.postal_code}</p>}
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                {guestEmail && <p>{guestEmail}</p>}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEditShipping}
            >
              <Icon name="edit" className="me-2 h-4 w-4" aria-hidden="true" />
              {tReview('edit')}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {tReview('paymentMethod')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {paymentMethod === 'cod'
                  ? tPayment('cod')
                  : paymentMethod}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <Icon name="edit" className="me-2 h-4 w-4" aria-hidden="true" />
              {tReview('edit')}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {tReview('orderItems', { count: itemCount })}
            </h3>
            <span className="text-sm text-muted-foreground">
              {tReview('orderSummary')}
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                  <Image
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {item.product.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tSummary('itemsCount', { count: item.quantity })}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(
                    item.quantity * (item.unit_price ?? item.product.price),
                    resolvedLocale
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <CouponInput
          subtotal={subtotal}
          onApply={handleCouponApply}
          onRemove={handleCouponRemove}
          appliedCode={couponCode}
          appliedDiscount={couponCode !== null ? discount : null}
        />

        <LoyaltyPointsInput
          balance={loyaltyPointsBalance}
          appliedPoints={loyaltyPoints}
          appliedDiscount={loyaltyDiscount}
          onApply={handleApplyLoyaltyPoints}
          onRemove={handleClearLoyaltyPoints}
          errorMessage={loyaltyErrorMessage}
          disabled={!user || loyaltyPointsBalance <= 0}
          isGuest={!user}
        />

        <OrderSummaryCheckout
          subtotal={subtotal}
          shipping={shippingCost}
          discount={discount}
          loyaltyDiscount={loyaltyDiscount}
          total={total}
          itemCount={itemCount}
        />

        <div className="space-y-3 rounded-lg border border-border bg-background p-4 shadow-sm">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <Checkbox
              id="checkout-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
              className="mt-0.5"
            />
            <span>{termsLabel}</span>
          </label>

        </div>

        {errorMessage && (
          <div className="rounded-md border border-coral-500 bg-coral-500/10 px-4 py-3 text-sm text-coral-600">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
          onClick={handlePlaceOrder}
          loading={isPending}
          disabled={isPending || items.length === 0 || !termsAccepted}
        >
          {isPending ? tReview('placingOrder') : tReview('placeOrder')}
        </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            <Icon name="arrow-left" className="me-2 h-4 w-4" flipRtl />
            {tSteps('payment')}
          </Button>
        </div>
      </div>
    </div>
  );
}
