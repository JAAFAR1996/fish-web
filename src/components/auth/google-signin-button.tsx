'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';

interface GoogleSigninButtonProps {
  mode?: 'signin' | 'signup';
  onError?: (message: string) => void;
}

export function GoogleSigninButton({
  mode = 'signin',
  onError,
}: GoogleSigninButtonProps) {
  const t = useTranslations('auth');
  const { supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignin = async () => {
    try {
      setIsLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setIsLoading(false);
        onError?.('auth.errors.unknownError');
      }
    } catch {
      setIsLoading(false);
      onError?.('auth.errors.unknownError');
    }
  };

  const label =
    mode === 'signup'
      ? t('oauth.signupWith', { provider: 'Google' })
      : t('oauth.signinWith', { provider: 'Google' });

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignin}
      loading={isLoading}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 18 18"
          className="h-5 w-5"
        >
          <path
            fill="#4285f4"
            d="M17.64 9.2045c0-.638-.0576-1.251-.1642-1.8385H9v3.4767h4.8443c-.209 1.1291-.8438 2.0866-1.7976 2.7321l2.9083 2.2575c1.6962-1.5641 2.685-3.8682 2.685-6.6278z"
          />
          <path
            fill="#34a853"
            d="M9 18c2.43 0 4.4647-.8063 5.9537-2.1776l-2.9083-2.2575c-.8063.54-1.8368.8602-3.0454.8602-2.3448 0-4.3306-1.5832-5.0368-3.7102L.9748 13.0616C2.4548 15.9788 5.4818 18 9 18z"
          />
          <path
            fill="#fbbc05"
            d="M3.9632 10.7148c-.1815-.54-.2847-1.1164-.2847-1.7148 0-.5984.1032-1.1748.2847-1.7148l-3.0439-2.37C.3398 6.3345 0 7.6243 0 9s.3398 2.6655.9193 3.7298l3.0439-2.015z"
          />
          <path
            fill="#ea4335"
            d="M9 3.5795c1.321 0 2.5057.4544 3.434 1.3467l2.577-2.577C13.4647.8827 11.43 0 9 0 5.4818 0 2.4548 2.0213.9193 5.2702l3.0439 2.015c.7062-2.127 2.692-3.7057 5.0368-3.7057z"
          />
        </svg>
      </span>
      {label}
    </Button>
  );
}
