import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { QAClient, type QAItem } from '@/components/learning/QaClient';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'Fish Web Q&A',
  description: 'Community answers and expert tips for aquariums.',
};

const QA_DATA: Record<'ar' | 'en', QAItem[]> = {
  ar: [
    {
      question: 'كيف أعرف أن دورة النيتروجين (Cycling) اكتملت؟',
      answer: 'عندما ينخفض الأمونيا والنتريت إلى 0 ويظهر النترات بقراءة مستقرة مع اختبار المياه.',
      category: 'أساسيات المياه',
      status: 'answered',
    },
    {
      question: 'أفضل إضاءة لحوض 60 لتر مزروع؟',
      answer: 'اختر إضاءة LED 6500K بقدرة 30-40 لومن/لتر مع تايمر 6-8 ساعات يومياً.',
      category: 'إضاءة ونباتات',
      status: 'answered',
    },
    {
      question: 'كيف أتخلص من العكارة البيضاء بعد تركيب حوض جديد؟',
      answer: 'غالباً نتيجة بكتيريا مفيدة؛ حافظ على الفلتر يعمل وأضف بكتيريا جاهزة وتجنب تغيير ماء كامل.',
      category: 'مشاكل شائعة',
      status: 'answered',
    },
  ],
  en: [
    {
      question: 'How do I know my tank cycle is complete?',
      answer: 'Ammonia and nitrite should read 0 while nitrate appears with a stable reading on a water test.',
      category: 'Water basics',
      status: 'answered',
    },
    {
      question: 'Best light for a 60L planted tank?',
      answer: 'Use 6500K LED at ~30-40 lumen/L with a timer set to 6–8 hours daily.',
      category: 'Lighting & plants',
      status: 'answered',
    },
    {
      question: 'How to clear white cloudiness after setup?',
      answer: 'It is usually a bacterial bloom; keep the filter running, seed beneficial bacteria, and avoid full water changes.',
      category: 'Quick fixes',
      status: 'answered',
    },
  ],
};

export default function QAPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';
  return <QAClient initialItems={QA_DATA[isAr ? 'ar' : 'en']} isAr={isAr} />;
}
