import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
  SUPPORT_WHATSAPP_NUMBER,
} from '@/lib/config/contact';
import { getSupportWhatsAppUrl } from '@/lib/utils';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'Support | Fish Web',
  description: 'الدعم الفني والتواصل مع فريق Fish Web.',
};

export default function SupportPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const whatsappHref = getSupportWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER);
  const phoneHref = `tel:+${SUPPORT_PHONE_E164}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        {params.locale === 'ar' ? 'الدعم' : 'Support'}
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? (
            <>
              للمساعدة أو الاستفسارات، راسلنا على البريد{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline-offset-4 hover:underline">
                {SUPPORT_EMAIL}
              </a>
              {' '}أو عبر واتساب{' '}
              <a href={whatsappHref} className="underline-offset-4 hover:underline" dir="ltr">
                {SUPPORT_PHONE_DISPLAY}
              </a>
              {' '}أو اتصل مباشرةً على{' '}
              <a href={phoneHref} className="underline-offset-4 hover:underline" dir="ltr">
                {SUPPORT_PHONE_DISPLAY}
              </a>
              .
            </>
          )
          : (
            <>
              For help or questions, reach us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline-offset-4 hover:underline">
                {SUPPORT_EMAIL}
              </a>
              {' '}or WhatsApp{' '}
              <a href={whatsappHref} className="underline-offset-4 hover:underline" dir="ltr">
                {SUPPORT_PHONE_DISPLAY}
              </a>
              {' '}or call us at{' '}
              <a href={phoneHref} className="underline-offset-4 hover:underline" dir="ltr">
                {SUPPORT_PHONE_DISPLAY}
              </a>
              .
            </>
          )}
      </p>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? 'متاحون يومياً من 9 صباحاً إلى 9 مساءً لتقديم الدعم الفني واقتراح المنتجات.'
          : 'We are available daily 9am–9pm for technical support and product guidance.'}
      </p>
    </div>
  );
}
