import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Icon, type IconName } from '@/components/ui';
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
  SUPPORT_WHATSAPP_NUMBER,
} from '@/lib/config/contact';
import { getSupportWhatsAppUrl } from '@/lib/utils';

type PageProps = { params: { locale: string } };

export const metadata: Metadata = {
  title: 'سياسة الشحن والتوصيل | Fish Web',
  description: 'مواعيد وأسعار الشحن داخل العراق مع خيارات الدفع عند الاستلام.',
};

export default function ShippingPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';
  const whatsappHref = getSupportWhatsAppUrl(
    SUPPORT_WHATSAPP_NUMBER,
    'السلام عليكم، أريد الاستفسار عن الشحن والتوصيل.'
  );

  const timeline = [
    isAr ? 'بغداد: 1-2 أيام عمل' : 'Baghdad: 1–2 business days',
    isAr ? 'المحافظات: 2-4 أيام عمل' : 'Governorates: 2–4 business days',
    isAr ? 'تأكيد عبر واتساب قبل الشحن' : 'WhatsApp confirmation before dispatch',
  ];

  const costs = [
    isAr ? 'بغداد: 5,000 – 7,000 د.ع حسب المنطقة' : 'Baghdad: 5,000 – 7,000 IQD',
    isAr ? 'المحافظات: 8,000 – 12,000 د.ع حسب شركة الشحن' : 'Governorates: 8,000 – 12,000 IQD',
    isAr ? 'الدفع عند الاستلام متاح' : 'Cash on delivery available',
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-aqua-600 dark:text-aqua-300">
          {isAr ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {isAr ? 'سياسة الشحن داخل العراق' : 'Iraq-wide delivery policy'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isAr
            ? 'نخزن في بغداد ونشحن يومياً عبر شركاء موثوقين مع إشعارات واتساب وتأكيد قبل الإرسال.'
            : 'We stock in Baghdad and ship daily through trusted partners, with WhatsApp updates and pre-dispatch confirmation.'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <PolicyCard
          title={isAr ? 'المدد المتوقعة' : 'Expected timelines'}
          items={timeline}
        />
        <PolicyCard
          title={isAr ? 'الرسوم' : 'Fees'}
          items={costs}
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isAr ? 'تعليمات التوصيل' : 'Delivery notes'}
        </h2>
        <ul className="mt-2 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
          <li>
            {isAr
              ? 'فحص الطلب قبل الدفع متاح مع المندوب.'
              : 'You may inspect items with the courier before paying.'}
          </li>
          <li>
            {isAr
              ? 'الطلبات الكبيرة أو أحواض الزجاج يتم تأكيدها عبر اتصال هاتفي.'
              : 'Large tanks or fragile items are confirmed by phone before dispatch.'}
          </li>
          <li>
            {isAr
              ? 'يمكن جدولة التوصيل في وقت يناسبك بالتنسيق مع المندوب.'
              : 'We can schedule delivery windows with the courier on request.'}
          </li>
        </ul>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-background p-4 sm:grid-cols-3">
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
          icon="truck"
          label={isAr ? 'التوصيل' : 'Delivery'}
          value={isAr ? 'يومي، مع تتبع عبر واتساب' : 'Daily dispatch with WhatsApp updates'}
        />
        <InfoLine
          icon="credit-card"
          label={isAr ? 'الدفع' : 'Payment'}
          value={isAr ? 'الدفع عند الاستلام أو إلكتروني' : 'COD or electronic payments'}
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
    <div className="space-y-1 rounded-lg bg-muted/40 p-3">
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
