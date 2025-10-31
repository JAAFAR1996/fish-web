'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import { Button, Icon, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { subscribeToNewsletterAction } from '@/lib/marketing/marketing-actions';
import type { Locale } from '@/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

type NewsletterFormProps = {
  className?: string;
};

export function NewsletterForm({ className }: NewsletterFormProps) {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setStatus('error');
      setMessage(t('invalidEmail'));
      inputRef.current?.focus();
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
      return;
    }

    setStatus('loading');
    
    // Call server action to subscribe
    startTransition(async () => {
      const result = await subscribeToNewsletterAction(email, locale);
      
      if (result.success) {
        if (result.alreadySubscribed) {
          setStatus('success');
          setMessage(t('alreadySubscribed') || 'You are already subscribed');
        } else {
          setStatus('success');
          setMessage(t('subscribeSuccess'));
        }
        setEmail('');
      } else {
        setStatus('error');
        setMessage(t('subscribeError') || 'Subscription failed. Please try again.');
      }
      
      // Auto-hide message after 5 seconds
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    });
  };

  return (
    <section aria-labelledby="newsletter-heading" className={cn('w-full', className)}>
      <h2 id="newsletter-heading" className="sr-only">
        {t('newsletter')}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-md mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={inputRef}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            aria-label={t('emailPlaceholder')}
            className="w-full"
            wrapperClassName="w-full"
            error={status === 'error'}
          />
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            className="w-full sm:w-auto"
          >
            {t('subscribeButton')}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('privacyNotice')}</p>
        {(status === 'success' || status === 'error') && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              'motion-safe:animate-fade-in',
              status === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
              status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            <Icon name={status === 'success' ? 'check' : 'alert'} size="sm" aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </section>
  );
}
