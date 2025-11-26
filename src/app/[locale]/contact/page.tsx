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
  title: 'تواصل معنا | Fish Web',
  description: 'طرق الاتصال والدعم المحلي داخل العراق.',
};

export default function ContactPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';
  const whatsappHref = getSupportWhatsAppUrl(
    SUPPORT_WHATSAPP_NUMBER,
    'السلام عليكم، أحتاج مساعدة بخصوص طلبي.'
  );

  const contactItems: Array<{ icon: IconName; label: string; value: string; href?: string; dir?: 'ltr' | 'rtl' }> = [
    { icon: 'phone', label: isAr ? 'هاتف' : 'Phone', value: SUPPORT_PHONE_DISPLAY, href: `tel:+${SUPPORT_PHONE_E164}`, dir: 'ltr' },
    { icon: 'whatsapp', label: 'WhatsApp', value: SUPPORT_PHONE_DISPLAY, href: whatsappHref, dir: 'ltr' },
    { icon: 'mail', label: isAr ? 'البريد الإلكتروني' : 'Email', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: 'home', label: isAr ? 'العنوان' : 'Address', value: isAr ? SUPPORT_ADDRESS : 'Baghdad – Iraq' },
    { icon: 'clock', label: isAr ? 'الساعات' : 'Hours', value: isAr ? 'يومياً 9 صباحاً – 9 مساءً' : 'Daily 9am – 9pm' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-aqua-600 dark:text-aqua-300">
          {isAr ? 'دعم محلي' : 'Local support'}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {isAr ? 'تواصل معنا' : 'Contact Us'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isAr
            ? 'نخدم العراق من بغداد مع دعم عبر الهاتف وواتساب. سنسعد بالإجابة عن أي استفسار حول المنتجات أو الطلبات.'
            : 'We serve Iraq from Baghdad with phone and WhatsApp support. We are happy to help with product or order questions.'}
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-background p-4 sm:grid-cols-2">
        {contactItems.map((item) => (
          <InfoLine key={item.label} {...item} />
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isAr ? 'عنوان الاستلام أو المعاينة' : 'Pickup/inspection address'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {isAr
            ? 'يمكن التنسيق لمعاينة بعض المنتجات أو الاستلام المباشر في بغداد بعد تأكيد الموعد عبر واتساب.'
            : 'We can arrange pickup or inspection for selected items in Baghdad after confirming a time on WhatsApp.'}
        </p>
      </div>
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
