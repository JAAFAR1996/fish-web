import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Icon, type IconName } from '@/components/ui';
import {
  RETURN_POLICY_WINDOW_DAYS,
  SUPPORT_ADDRESS,
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
  title: 'سياسة الإرجاع | Fish Web',
  description: 'إرشادات الإرجاع والاستبدال مع دعم واتساب وخيارات الدفع عند الاستلام.',
};

export default function ReturnPolicyPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';
  const whatsappHref = getSupportWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-aqua-600 dark:text-aqua-300">
          {isAr ? 'ثقة وشفافية' : 'Trust & Transparency'}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {isAr ? 'سياسة الإرجاع والاستبدال' : 'Returns & Exchanges'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isAr
            ? `يمكنك الإرجاع أو الاستبدال خلال ${RETURN_POLICY_WINDOW_DAYS} أيام من استلام الطلب. نساعدك عبر الهاتف أو واتساب ونوفر الدفع عند الاستلام لتجربة خالية من القلق.`
            : `You can return or exchange within ${RETURN_POLICY_WINDOW_DAYS} days of delivery. Reach us by phone or WhatsApp, with cash-on-delivery available for a worry-free experience.`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PolicyCard
          title={isAr ? 'متى يحق لك الإرجاع؟' : 'When can you return?'}
          items={[
            isAr ? 'وصول المنتج تالفاً أو غير مطابق' : 'Damaged or incorrect items on arrival',
            isAr ? 'مقاس أو قدرة غير مناسبة بعد الفحص' : 'Wrong size or capacity after inspection',
            isAr ? 'تجربة خالية من المخاطر خلال 7 أيام' : 'Risk-free trial within 7 days',
          ]}
        />
        <PolicyCard
          title={isAr ? 'خطوات سريعة' : 'Quick steps'}
          items={[
            isAr ? 'صوّر المنتج والعبوة إن وجد تلف' : 'Photograph the item/packaging if damaged',
            isAr ? 'تواصل معنا عبر واتساب أو الهاتف' : 'Contact us via WhatsApp or phone',
            isAr ? 'نرتب الاستلام أو الاستبدال فوراً' : 'We schedule pickup or exchange right away',
          ]}
        />
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:grid-cols-3">
        <InfoLine
          icon="phone"
          label={isAr ? 'هاتف' : 'Phone'}
          value={SUPPORT_PHONE_DISPLAY}
          href={`tel:+${SUPPORT_PHONE_E164}`}
          dir="ltr"
        />
        <InfoLine
          icon="whatsapp"
          label="WhatsApp"
          value={SUPPORT_PHONE_DISPLAY}
          href={whatsappHref}
          dir="ltr"
        />
        <InfoLine
          icon="home"
          label={isAr ? 'العنوان' : 'Address'}
          value={isAr ? SUPPORT_ADDRESS : 'Baghdad – Iraq'}
        />
        <InfoLine
          icon="mail"
          label="Email"
          value={SUPPORT_EMAIL}
          href={`mailto:${SUPPORT_EMAIL}`}
        />
        <InfoLine
          icon="credit-card"
          label={isAr ? 'الدفع' : 'Payment'}
          value={isAr ? 'الدفع عند الاستلام متاح' : 'Cash on delivery available'}
        />
        <InfoLine
          icon="shield-check"
          label={isAr ? 'مدة الإرجاع' : 'Return window'}
          value={isAr ? `${RETURN_POLICY_WINDOW_DAYS} أيام من الاستلام` : `${RETURN_POLICY_WINDOW_DAYS} days from delivery`}
        />
      </div>
    </div>
  );
}

function PolicyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <ul className="mt-2 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  href,
  dir,
}: {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
  dir?: 'ltr' | 'rtl';
}) {
  const content = (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon name={icon} className="h-4 w-4 text-aqua-600" aria-hidden />
      <span dir={dir}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-1 rounded-lg bg-background/80 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {href ? (
        <a
          href={href}
          className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
          dir={dir}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
