import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'About Fish Web',
  description: 'تعرف على متجر Fish Web ورؤيتنا لخدمة هواة الأحواض.',
};

export default function AboutPage({ params }: PageProps) {
  setRequestLocale(params.locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        {params.locale === 'ar' ? 'من نحن' : 'About Fish Web'}
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? 'نحن فريق متخصص في معدات وأدوات الأحواض المائية، نركز على دعم الهواة وتوفير منتجات موثوقة مع شحن سريع داخل العراق.'
          : 'We are a team dedicated to aquarium gear and supplies, focused on supporting enthusiasts with reliable products and fast shipping across Iraq.'}
      </p>
      <p className="text-muted-foreground leading-relaxed">
        {params.locale === 'ar'
          ? 'هدفنا هو تبسيط رحلة بناء عالمك المائي من خلال منتجات مختارة وأدلة عملية ودعم فني محلي.'
          : 'Our goal is to simplify your aquarium journey with curated products, practical guides, and local expert support.'}
      </p>
    </div>
  );
}
