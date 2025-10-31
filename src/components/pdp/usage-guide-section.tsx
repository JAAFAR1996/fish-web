import { getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Locale, Product } from '@/types';

export interface UsageGuideSectionProps {
  product: Product;
  locale: Locale;
  className?: string;
}

type GuideSection = 'heating' | 'filtration' | 'lighting' | 'waterCare' | 'default';

type GuideContent = {
  installation: string[];
  maintenance: string[];
  tips: string[];
};

const GUIDE_COPY: Record<Locale, Record<GuideSection, GuideContent>> = {
  en: {
    heating: {
      installation: [
        'Position the heater near the main flow to distribute heat evenly.',
        'Allow the heater to acclimate in the tank water for 20 minutes before powering on.',
        'Set the thermostat gradually until you reach the desired temperature.',
      ],
      maintenance: [
        'Check the temperature daily with a separate thermometer.',
        'Unplug and wipe the heater monthly to remove mineral buildup.',
        'Inspect suction cups and seals every few months and replace if worn.',
      ],
      tips: [
        'Use two smaller heaters for large tanks to provide redundancy.',
        'Keep the heater fully submerged to avoid overheating the glass casing.',
        'Plug the heater into a drip loop or surge protector for safety.',
      ],
    },
    filtration: {
      installation: [
        'Rinse all filter media in tank water before first use.',
        'Prime the filter and ensure intake and output pipes are fully submerged.',
        'Adjust the outflow to avoid disturbing substrate or plants.',
      ],
      maintenance: [
        'Clean mechanical media every 2–4 weeks using tank water.',
        'Replace chemical media such as carbon monthly or as needed.',
        'Inspect impellers and hoses for blockages during every service.',
      ],
      tips: [
        'Rotate between media trays to preserve beneficial bacteria.',
        'Keep a spare set of filter pads to avoid downtime during cleaning.',
        'Pair the filter with a surface skimmer to improve oxygen exchange.',
      ],
    },
    lighting: {
      installation: [
        'Mount the fixture 15–20 cm above the water line for even spread.',
        'Use a timer to provide consistent photoperiods for plants and fish.',
        'Ensure cables form a drip loop before reaching the outlet.',
      ],
      maintenance: [
        'Wipe lenses weekly to remove condensation and mineral deposits.',
        'Check cooling fans and vents monthly to prevent overheating.',
        'Replace aging bulbs or LED strips according to manufacturer guidance.',
      ],
      tips: [
        'Start with 6–8 hours of light for new tanks and adjust gradually.',
        'Blend white and spectrally enhanced channels for vivid plant growth.',
        'Dim lights during acclimation to reduce stress on new livestock.',
      ],
    },
    waterCare: {
      installation: [
        'Shake conditioners well and dose according to tank volume.',
        'Add treatments near the filter intake for quick distribution.',
        'Aerate the tank during medication cycles to maintain oxygen levels.',
      ],
      maintenance: [
        'Test water parameters weekly to track treatment effectiveness.',
        'Perform partial water changes between treatment doses if instructed.',
        'Store bottles in a cool, dark place to preserve potency.',
      ],
      tips: [
        'Record each treatment in a log to avoid double dosing.',
        'Deactivate carbon media when using medications to prevent adsorption.',
        'Follow up with beneficial bacteria to rebuild the biofilter.',
      ],
    },
    default: {
      installation: [
        'Read through the quick-start guide before installing the product.',
        'Lay out all included parts and verify nothing is missing.',
        'Follow the recommended order of assembly to avoid rework.',
      ],
      maintenance: [
        'Inspect moving parts on a regular schedule to maintain performance.',
        'Clean equipment with aquarium-safe tools to avoid contamination.',
        'Log maintenance dates to keep a consistent routine.',
      ],
      tips: [
        'Keep a small toolkit near your aquarium for quick adjustments.',
        'Monitor equipment performance after every water change.',
        'Contact support if you notice unusual noise or vibration.',
      ],
    },
  },
  ar: {
    heating: {
      installation: [
        'ضع السخان بالقرب من تدفق الماء لضمان توزيع الحرارة بشكل متساوٍ.',
        'اترك السخان داخل الماء لمدة 20 دقيقة قبل تشغيله حتى يتأقلم مع درجة الحرارة.',
        'اضبط منظم الحرارة تدريجياً حتى تصل إلى الدرجة المطلوبة.',
      ],
      maintenance: [
        'تحقق يومياً من درجة الحرارة باستخدام ميزان حرارة منفصل.',
        'افصل السخان ونظفه شهرياً لإزالة الترسبات المعدنية.',
        'افحص قواعد التثبيت والحشوات كل بضعة أشهر واستبدل التالف منها.',
      ],
      tips: [
        'استخدم سخانين أصغر حجماً في الأحواض الكبيرة لضمان الأمان.',
        'احرص على غمر السخان بالكامل لتجنب ارتفاع حرارة الغلاف الزجاجي.',
        'استخدم واقياً من الصدمات أو فيوز حماية لتأمين السخان كهربائياً.',
      ],
    },
    filtration: {
      installation: [
        'اشطف وسائط الفلتر في ماء الحوض قبل الاستخدام الأول.',
        'قم بتعبئة الفلتر بالماء وتأكد من غمر أنبوب السحب والدفع بالكامل.',
        'اضبط مستوى التدفق كي لا يزعج النبات أو يحرّك التربة.',
      ],
      maintenance: [
        'نظف الوسائط الميكانيكية كل 2-4 أسابيع باستخدام ماء الحوض.',
        'استبدل الوسائط الكيميائية مثل الفحم بشكل شهري أو عند الحاجة.',
        'افحص المروحة والأنابيب في كل عملية صيانة للتأكد من عدم وجود انسداد.',
      ],
      tips: [
        'قم بمداورة تنظيف الوسائط للحفاظ على البكتيريا المفيدة.',
        'احتفظ بوسائط إضافية لتقليل التوقف أثناء التنظيف.',
        'استخدم كاشط السطح لتحسين الأكسجة وتقليل الزيوت.',
      ],
    },
    lighting: {
      installation: [
        'ثبّت وحدة الإضاءة على ارتفاع 15-20 سم فوق سطح الماء لتوزيع مثالي.',
        'استخدم مؤقتاً لضبط فترة الإضاءة اليومية للنبات والأسماك.',
        'تأكد من وجود حلقة مانعة لتسرب الماء في مسار الأسلاك قبل الوصول إلى المقبس.',
      ],
      maintenance: [
        'امسح العدسات أسبوعياً لإزالة البخار والرواسب.',
        'افحص مراوح التبريد والفتحات شهرياً لمنع ارتفاع الحرارة.',
        'استبدل المصابيح أو شرائط LED القديمة حسب توصيات الشركة المصنعة.',
      ],
      tips: [
        'ابدأ بست إلى ثماني ساعات إضاءة يومياً في الأحواض الجديدة و زد تدريجياً.',
        'امزج قنوات الضوء الأبيض مع الطيف الكامل لإبراز النباتات.',
        'اخفض شدة الإضاءة أثناء acclimation لتقليل توتر الكائنات الجديدة.',
      ],
    },
    waterCare: {
      installation: [
        'رج العبوات جيداً وجرّع وفق حجم الحوض الفعلي.',
        'أضف المعالجة بالقرب من مدخل الفلتر لتتوزع بسرعة.',
        'وفر تهوية إضافية عند استخدام الأدوية للحفاظ على الأكسجين.',
      ],
      maintenance: [
        'اختبر معايير الماء أسبوعياً لمتابعة فعالية العلاج.',
        'قم بتغيير جزئي للماء بين الجرعات إذا أوصت الإرشادات.',
        'خزن المنتجات في مكان بارد ومظلم للحفاظ على جودتها.',
      ],
      tips: [
        'سجّل كل جرعة في دفتر ملاحظات لتفادي التكرار.',
        'أزل الفحم النشط أثناء استخدام الأدوية كي لا يمتصها.',
        'استخدم بكتيريا نافعة بعد انتهاء العلاج لإعادة توازن الفلتر.',
      ],
    },
    default: {
      installation: [
        'اقرأ الدليل السريع قبل البدء بالتركيب.',
        'تأكد من توفر جميع القطع والأدوات قبل التشغيل.',
        'اتبع ترتيب التركيب الموصى به لتجنب إعادة العمل.',
      ],
      maintenance: [
        'افحص الأجزاء المتحركة بانتظام للحفاظ على الأداء.',
        'نظف المعدات بأدوات آمنة للأحواض لتفادي التلوث.',
        'دوّن مواعيد الصيانة للحفاظ على جدول ثابت.',
      ],
      tips: [
        'احتفظ بمجموعة أدوات صغيرة قرب الحوض للمعالجات السريعة.',
        'راقب أداء المعدات بعد كل تغيير ماء.',
        'تواصل مع الدعم عند ملاحظة أصوات أو اهتزازات غير طبيعية.',
      ],
    },
  },
};

const SECTION_ICONS: Record<'installation' | 'maintenance' | 'tips', string> = {
  installation: 'settings',
  maintenance: 'loader',
  tips: 'star',
};

export async function UsageGuideSection({
  product,
  locale,
  className,
}: UsageGuideSectionProps) {
  const t = await getTranslations('pdp.usageGuide');

  const guideKey = ((): GuideSection => {
    if (product.category === 'heating') return 'heating';
    if (product.category === 'filtration') return 'filtration';
    if (product.category === 'plantLighting') return 'lighting';
    if (product.category === 'waterCare') return 'waterCare';
    return 'default';
  })();

  const content =
    GUIDE_COPY[locale as Locale]?.[guideKey] ??
    GUIDE_COPY[locale as Locale]?.default ??
    GUIDE_COPY.en.default;

  const sections: Array<{
    key: keyof GuideContent;
    heading: string;
    points: string[];
  }> = [
    {
      key: 'installation',
      heading: t('installation'),
      points: content.installation,
    },
    {
      key: 'maintenance',
      heading: t('maintenance'),
      points: content.maintenance,
    },
    {
      key: 'tips',
      heading: t('tips'),
      points: content.tips,
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <p className="text-sm text-muted-foreground">
        {t('placeholder')}
      </p>

      {sections.map(({ key, heading, points }) => (
        <div
          key={key}
          className="rounded-lg border border-border/60 bg-muted/30 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <Icon name={SECTION_ICONS[key]} size="sm" className="text-muted-foreground" />
            <h4 className="text-base font-semibold text-foreground">{heading}</h4>
          </div>
          <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
