'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Input } from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { validateOtp, validatePhone } from '@/lib/auth/validation';
import type { FormStatus, ValidationResult } from '@/types';

interface PhoneSigninFormProps {
  onSuccess: () => void;
}

type ValidationErrors = ValidationResult['errors'];

const RESEND_INTERVAL = 60;

export function PhoneSigninForm({ onSuccess }: PhoneSigninFormProps) {
  const t = useTranslations('auth');
  const { supabase } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [isPending, startTransition] = useTransition();

  const translateKey = (key?: string | null) => {
    if (!key) return '';
    if (key.startsWith('auth.')) {
      return t(key.slice('auth.'.length));
    }
    return t(key);
  };

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = validatePhone(phone);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormError('auth.validation.phoneInvalid');
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      setStatus('loading');
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      });

      if (error) {
        setStatus('error');
        setFormError('auth.errors.unknownError');
        return;
      }

      setStatus('success');
      setOtpSent(true);
      setFormError(null);
      setResendTimer(RESEND_INTERVAL);
    });
  };

  const handleVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = validateOtp(otp);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormError('auth.validation.otpInvalid');
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      setStatus('loading');
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        setStatus('error');
        setFormError('auth.validation.otpInvalid');
        return;
      }

      setStatus('success');
      setFormError(null);
      onSuccess();
    });
  };

  if (!otpSent) {
    return (
      <form className="space-y-6" onSubmit={handleSendOtp}>
        {formError && status !== 'success' && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {translateKey(formError)}
          </div>
        )}

        <Input
          label={t('phone.phoneNumber')}
          placeholder="+9647XXXXXXXXX"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          disabled={isPending}
          helperText={t('phone.phoneHint')}
          error={
            fieldErrors.phone ? translateKey(fieldErrors.phone) : undefined
          }
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isPending}
        >
          {t('phone.sendOtp')}
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleVerifyOtp}>
      <div className="rounded-md border border-aqua-500/40 bg-aqua-500/10 px-4 py-3 text-sm text-aqua-700 dark:text-aqua-200">
        {t('phone.otpSent', { phone })}
      </div>

      {formError && status !== 'success' && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {translateKey(formError)}
        </div>
      )}

      <Input
        label={t('phone.verificationCode')}
        placeholder="123456"
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        disabled={isPending}
        error={fieldErrors.otp ? translateKey(fieldErrors.otp) : undefined}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isPending}
      >
        {t('phone.verifyCode')}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setOtpSent(false)}
          className="font-medium text-aqua-600 transition-colors hover:text-aqua-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('phone.changeNumber')}
        </button>
        <Button
          type="button"
          variant="ghost"
          disabled={resendTimer > 0 || isPending}
          onClick={() => {
            setOtp('');
            setFormError(null);
            setFieldErrors({});
            setResendTimer(RESEND_INTERVAL);
            startTransition(async () => {
              await supabase.auth.signInWithOtp({
                phone,
                options: { shouldCreateUser: true },
              });
            });
          }}
        >
          {resendTimer > 0
            ? t('phone.resendIn', { seconds: resendTimer })
            : t('phone.resendCode')}
        </Button>
      </div>
    </form>
  );
}
