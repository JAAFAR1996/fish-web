import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Icon, type IconName } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/config/contact';

type PageProps = { params: { locale: string } };

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | Fish Web',
  description: 'كيف نحمي بياناتك ونستخدمها عند التسوق في Fish Web.',
};

export default function PrivacyPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';

  const sections = [
    {
      title: isAr ? 'البيانات التي نجمعها' : 'Data we collect',
      items: [
        isAr ? 'معلومات الحساب (الاسم، البريد، الهاتف)' : 'Account info (name, email, phone)',
        isAr ? 'عناوين التوصيل والفواتير' : 'Shipping and billing addresses',
        isAr ? 'سجل الطلبات والتفضيلات' : 'Order history and preferences',
      ],
    },
    {
      title: isAr ? 'كيف نستخدم البيانات' : 'How we use it',
      items: [
        isAr ? 'تنفيذ الطلبات وتحديث حالتها' : 'Fulfill orders and update status',
        isAr ? 'الدعم عبر الهاتف أو واتساب' : 'Support via phone/WhatsApp',
        isAr ? 'تنبيهات عروض واختيارات مخصصة' : 'Offers and tailored recommendations',
      ],
    },
    {
      title: isAr ? 'حقوقك' : 'Your rights',
      items: [
        isAr ? 'طلب تصحيح أو حذف البيانات' : 'Request corrections or deletion',
        isAr ? 'إلغاء الاشتراك في الرسائل التسويقية' : 'Opt out of marketing messages',
        isAr ? 'الوصول لنسخة من بياناتك' : 'Access a copy of your data',
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-aqua-600 dark:text-aqua-300">
          {isAr ? 'الخصوصية' : 'Privacy'}
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {isAr
            ? 'نستخدم بياناتك فقط لتقديم تجربة تسوق موثوقة، ولا نشاركها إلا مع مزودي الدفع والتوصيل حسب الحاجة.'
            : 'We use your data only to deliver a trustworthy shopping experience and share it only with payment and delivery partners as needed.'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <SectionCard key={section.title} title={section.title} items={section.items} />
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isAr ? 'ملفات تعريف الارتباط (Cookies)' : 'Cookies'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {isAr
            ? 'نستخدم الكوكيز لتسجيل الدخول، تذكر السلة، وتحسين الأداء. يمكنك تعطيلها من المتصفح، لكن بعض الميزات قد لا تعمل بالكامل.'
            : 'We use cookies for sign-in, cart memory, and performance. You can disable them in your browser, but some features may be limited.'}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isAr ? 'التواصل بخصوص الخصوصية' : 'Privacy contact'}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground">
          <Icon name="mail" className="h-4 w-4 text-aqua-600" aria-hidden />
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline-offset-4 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          <span className="text-muted-foreground">
            {isAr ? 'سنرد خلال يومي عمل.' : 'We respond within two business days.'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
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
