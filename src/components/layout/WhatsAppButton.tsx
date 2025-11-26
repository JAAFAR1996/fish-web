'use client';

import { useLocale } from 'next-intl';

import { Icon } from '@/components/ui';
import { getSupportWhatsAppUrl } from '@/lib/utils';
import { SUPPORT_PHONE_E164, SUPPORT_WHATSAPP_NUMBER } from '@/lib/config/contact';

export function WhatsAppButton() {
  const locale = useLocale();
  const defaultMessage =
    locale === 'ar'
      ? 'السلام عليكم، عندي سؤال عن منتج…'
      : 'Hello, I have a question about a product…';
  const href = getSupportWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER, defaultMessage);
  const label = locale === 'ar' ? 'تحدث معنا على واتساب' : 'Chat on WhatsApp';

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 end-4 z-[60] inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-5"
      aria-label={`${label} +${SUPPORT_PHONE_E164}`}
    >
      <Icon name="whatsapp" className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
      <span className="text-xs font-medium sm:hidden" dir="ltr">
        +{SUPPORT_PHONE_E164}
      </span>
    </a>
  );
}
