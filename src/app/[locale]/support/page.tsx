import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'Support | Fish Web',
  description: 'الدعم الفني والتواصل مع فريق Fish Web.',
};

export default function SupportPage({ params }: PageProps) {
  setRequestLocale(params.locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        {params.locale === 'ar' ? 'الدعم' : 'Support'}
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? 'للمساعدة أو الاستفسارات، راسلنا على البريد support@fishweb.iq أو عبر واتساب 0770-000-0000.'
          : 'For help or questions, reach us at support@fishweb.iq or WhatsApp 0770-000-0000.'}
      </p>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? 'متاحون يومياً من 9 صباحاً إلى 9 مساءً لتقديم الدعم الفني واقتراح المنتجات.'
          : 'We are available daily 9am–9pm for technical support and product guidance.'}
      </p>
    </div>
  );
}
