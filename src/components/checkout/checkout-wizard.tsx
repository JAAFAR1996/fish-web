'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import type {
  CheckoutStep,
  PaymentMethod,
  SavedAddress,
  ShippingAddressSnapshot,
} from '@/types';

import { useCart } from '@/components/providers/CartProvider';
import { calculateShippingCost } from '@/lib/checkout/shipping-rates';
import { cn } from '@/lib/utils';
import { CheckoutProgress } from './checkout-progress';
import { ShippingInfoStep } from './shipping-info-step';
import { PaymentMethodStep } from './payment-method-step';
import { OrderReviewStep } from './order-review-step';

interface ShippingState {
  address: ShippingAddressSnapshot;
  guestEmail?: string | null;
  saveAddress?: boolean;
  shippingAddressId?: string | null;
}

export interface CheckoutWizardProps {
  user: User | null;
  savedAddresses: SavedAddress[];
  loyaltyPointsBalance: number;
  className?: string;
}

export function CheckoutWizard({
  user,
  savedAddresses,
  loyaltyPointsBalance,
  className,
}: CheckoutWizardProps) {
  const { subtotal } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
  const [shippingState, setShippingState] = useState<ShippingState | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (currentStep !== 'shipping' && !shippingState) {
      setCurrentStep('shipping');
    }
  }, [currentStep, shippingState]);

  useEffect(() => {
    if (currentStep === 'review' && !paymentMethod) {
      setCurrentStep('payment');
    }
  }, [currentStep, paymentMethod]);

  const shippingCost = useMemo(() => {
    if (!shippingState) {
      return 0;
    }
    return calculateShippingCost(shippingState.address.governorate, subtotal);
  }, [shippingState, subtotal]);

  const markStepCompleted = useCallback((step: CheckoutStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const handleShippingContinue = useCallback(
    ({
      shippingAddress,
      guestEmail,
      saveAddress,
      shippingAddressId,
    }: {
      shippingAddress: ShippingAddressSnapshot;
      guestEmail?: string | null;
      saveAddress?: boolean;
      shippingAddressId?: string | null;
    }) => {
      setShippingState({
        address: shippingAddress,
        guestEmail: guestEmail ?? null,
        saveAddress,
        shippingAddressId,
      });
      markStepCompleted('shipping');
      setCurrentStep('payment');
    },
    [markStepCompleted]
  );

  const handlePaymentContinue = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method);
      markStepCompleted('payment');
      setCurrentStep('review');
    },
    [markStepCompleted]
  );

  const handleBackToShipping = useCallback(() => {
    setCurrentStep('shipping');
  }, []);

  const handleBackToPayment = useCallback(() => {
    setCurrentStep('payment');
  }, []);

  return (
    <div className={cn('space-y-8', className)}>
      <CheckoutProgress currentStep={currentStep} completedSteps={completedSteps} />
      <div className="animate-step-fade-in">
        {currentStep === 'shipping' && (
          <ShippingInfoStep
            user={user}
            savedAddresses={savedAddresses}
            initialData={shippingState?.address ?? null}
            initialGuestEmail={shippingState?.guestEmail ?? null}
            initialSaveAddress={Boolean(shippingState?.saveAddress)}
            selectedAddressId={shippingState?.shippingAddressId ?? null}
            onContinue={handleShippingContinue}
          />
        )}

        {currentStep === 'payment' && shippingState && (
          <PaymentMethodStep
            initialData={paymentMethod}
            onContinue={handlePaymentContinue}
            onBack={handleBackToShipping}
          />
        )}

        {currentStep === 'review' && shippingState && paymentMethod && (
          <OrderReviewStep
            user={user}
            shippingAddress={shippingState.address}
            paymentMethod={paymentMethod}
            guestEmail={shippingState.guestEmail ?? null}
            shippingCost={shippingCost}
            shippingAddressId={shippingState.shippingAddressId ?? null}
            loyaltyPointsBalance={loyaltyPointsBalance}
            onBack={handleBackToPayment}
            onEditShipping={handleBackToShipping}
          />
        )}
      </div>
    </div>
  );
}
