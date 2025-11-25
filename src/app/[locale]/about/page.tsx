import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'About Fish Web',
  description: 'تعرف على متجر Fish Web ورؤيتنا لخدمة هواة الأحواض.',
};

const STORY = {
  ar: {
    headline: 'قصة بدأت من حوض صغير في بغداد',
    sub: 'نحن هواة قبل أن نكون بائعين. بنينا Fish Web لنوفر معدات موثوقة، دعم محلي، وتجربة ثنائية اللغة.',
  },
  en: {
    headline: 'A story that started with a small tank in Baghdad',
    sub: 'We were hobbyists before we were merchants—building Fish Web to deliver trusted gear, local support, and bilingual guidance.',
  },
} as const;

const VALUES = {
  ar: [
    { title: 'دعم محلي سريع', desc: 'مركز توزيع في بغداد وشحن يومي لكل المحافظات.' },
    { title: 'منتجات موثوقة', desc: 'اختيارات مجربة مع ضمان استرجاع واستبدال عادل.' },
    { title: 'إرشاد ثنائي اللغة', desc: 'دليل عربي/إنجليزي، وإجابات سريعة عبر واتساب.' },
  ],
  en: [
    { title: 'Local speed', desc: 'Baghdad hub with daily shipping to every governorate.' },
    { title: 'Trusted gear', desc: 'Curated products with fair returns and replacements.' },
    { title: 'Bilingual help', desc: 'Arabic/English guides and quick WhatsApp answers.' },
  ],
};

const TEAM = [
  { name: 'Ali Kareem', role: 'Operations Lead', initials: 'AK' },
  { name: 'Sara Al-Taie', role: 'Customer Success', initials: 'SA' },
  { name: 'Omar Hassan', role: 'Product & Merchandising', initials: 'OH' },
  { name: 'Noor Al-Hassan', role: 'Content & Guides', initials: 'NA' },
];

const CONTACT = {
  addressAr: 'شارع اليرموك، بغداد، العراق',
  addressEn: 'Al-Yarmouk Street, Baghdad, Iraq',
  regAr: 'الرقم التجاري: 42531 بغداد',
  regEn: 'Commercial Registration: 42531 Baghdad',
  phone: '+964 770 000 0000',
  email: 'support@fishweb.iq',
};

export default function AboutPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';

  const stats = [
    {
      label: isAr ? 'طلبات موثوقة' : 'Orders fulfilled',
      value: '25K+',
    },
    {
      label: isAr ? 'محافظات نخدمها' : 'Governorates served',
      value: '18',
    },
    {
      label: isAr ? 'متوسط وقت التوصيل' : 'Avg. delivery',
      value: isAr ? '2-4 أيام' : '2–4 days',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-aqua-600 via-sky-600 to-blue-600 text-white shadow-xl">
        <div className="grid items-center gap-8 px-6 py-10 sm:grid-cols-2 sm:px-10 lg:px-14">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              <Icon name="sparkles" className="h-4 w-4" />
              <span>{isAr ? 'مركز مخصص لعشاق الأكواريوم' : 'Built for aquarists in Iraq'}</span>
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {STORY[isAr ? 'ar' : 'en'].headline}
            </h1>
            <p className="text-lg text-white/85">
              {STORY[isAr ? 'ar' : 'en'].sub}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Tag chip>{isAr ? 'شحن يومي داخل العراق' : 'Daily Iraq-wide shipping'}</Tag>
              <Tag chip>{isAr ? 'دعم واتساب' : 'WhatsApp support'}</Tag>
              <Tag chip>{isAr ? 'عربي / إنجليزي' : 'Arabic / English'}</Tag>
            </div>
          </div>
          <div className="grid gap-4 rounded-2xl bg-white/10 p-4 sm:grid-cols-3 sm:gap-6 sm:p-6">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl bg-white/10 p-4 shadow-sm backdrop-blur">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-sm text-white/80">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {isAr ? 'لماذا نبني Fish Web؟' : 'Why we built Fish Web'}
          </h2>
          <div className="grid gap-3">
            {VALUES[isAr ? 'ar' : 'en'].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-border/70 bg-gradient-to-br from-sand-50 via-white to-aqua-50 p-5 shadow-sm dark:from-sand-900/40 dark:via-background dark:to-aqua-900/10">
          <h3 className="text-lg font-semibold text-foreground">
            {isAr ? 'بيانات الثقة' : 'Trust & Contact'}
          </h3>
          <div className="space-y-3 text-sm text-foreground">
            <InfoLine
              icon="home"
              label={isAr ? 'العنوان' : 'Address'}
              value={isAr ? CONTACT.addressAr : CONTACT.addressEn}
            />
            <InfoLine
              icon="shield-check"
              label={isAr ? 'السجل التجاري' : 'Commercial Registration'}
              value={isAr ? CONTACT.regAr : CONTACT.regEn}
            />
            <InfoLine
              icon="phone"
              label={isAr ? 'هاتف' : 'Phone'}
              value={CONTACT.phone}
            />
            <InfoLine
              icon="mail"
              label="Email"
              value={CONTACT.email}
            />
          </div>
          <div className="rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
            {isAr
              ? 'نخزن في بغداد لضمان توصيل أسرع وخدمة ما بعد البيع بوقت استجابة أقل.'
              : 'We stock in Baghdad to deliver faster and resolve support requests quickly.'}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="users" className="h-5 w-5 text-aqua-600" />
          <h2 className="text-2xl font-semibold text-foreground">
            {isAr ? 'فريق العمل' : 'Meet the team'}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-center shadow-sm"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aqua-500 to-sky-500 text-lg font-semibold text-white">
                {member.initials}
              </div>
              <div className="text-base font-semibold text-foreground">{member.name}</div>
              <div className="text-sm text-muted-foreground">{member.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tag({ children, chip = false }: { children: string; chip?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        chip ? 'bg-white/15 text-white' : 'bg-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-background/80 p-3 shadow-sm">
      <Icon name={icon} className="mt-0.5 h-4 w-4 text-aqua-600" />
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}
