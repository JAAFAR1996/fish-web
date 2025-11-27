'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/components/ui/icon';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { useGSAP, gsap } from '@/hooks/useGSAP';
import type {
  DifficultyLevel,
  FishFinderOption,
  FishFinderProfile,
  FishFinderResult,
  FishFinderStep,
  Product,
} from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

type FishFinderWizardProps = {
  products: Product[];
};

type WizardStep = FishFinderStep & {
  key: keyof FishFinderProfile;
  helper?: string;
};

type StoredState = {
  currentStep: number;
  answers: Record<number, string>;
  resultIds?: string[];
};

const STORAGE_KEY = 'fish-finder-state';

const STEPS: WizardStep[] = [
  {
    id: 1,
    key: 'tankSize',
    question: 'fishFinder.step1.question',
    helper: 'fishFinder.step1.helper',
    options: [
      { id: 'nano', label: '≤ 40L', value: 'nano' },
      { id: 'small', label: '60–120L', value: 'small' },
      { id: 'medium', label: '120–250L', value: 'medium' },
      { id: 'large', label: '250L+', value: 'large' },
    ],
  },
  {
    id: 2,
    key: 'experience',
    question: 'fishFinder.step2.question',
    helper: 'fishFinder.step2.helper',
    options: [
      { id: 'easy', label: 'Easy', value: 'easy' },
      { id: 'medium', label: 'Medium', value: 'medium' },
      { id: 'hard', label: 'Hard', value: 'hard' },
    ],
  },
  {
    id: 3,
    key: 'style',
    question: 'fishFinder.step3.question',
    helper: 'fishFinder.step3.helper',
    options: [
      { id: 'community', label: 'Community', value: 'community' },
      { id: 'planted', label: 'Planted / Nature', value: 'planted' },
      { id: 'showcase', label: 'Showpiece', value: 'showcase' },
      { id: 'nano', label: 'Nano focus', value: 'nano' },
    ],
  },
  {
    id: 4,
    key: 'bioload',
    question: 'fishFinder.step4.title',
    helper: 'fishFinder.filters.bioload',
    options: [
      { id: 'low', label: 'Low bioload', value: 'low' },
      { id: 'medium', label: 'Medium', value: 'medium' },
      { id: 'high', label: 'High', value: 'high' },
    ],
  },
];

const tankSizeRanges: Record<string, { min?: number; max?: number }> = {
  nano: { max: 40 },
  small: { max: 120 },
  medium: { min: 120, max: 250 },
  large: { min: 250 },
};

const difficultyScoreMap: Record<DifficultyLevel, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const parseStoredState = (): StoredState | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
};

const normalizeProfile = (answers: Record<number, string>): FishFinderProfile => {
  const profile: FishFinderProfile = {};
  STEPS.forEach((step) => {
    const value = answers[step.id];
    if (!value) return;
    profile[step.key] = value as never;
  });
  return profile;
};

const scoreProduct = (product: Product, profile: FishFinderProfile): number => {
  let score = (product.rating ?? 0) * 10 + Math.min(product.reviewCount ?? 0, 300) / 30;

  // Difficulty preference
  if (profile.experience && product.difficulty) {
    const desired = difficultyScoreMap[profile.experience];
    const actual = difficultyScoreMap[product.difficulty];
    const diffGap = Math.abs(desired - actual);
    score += Math.max(0, 12 - diffGap * 6);
  }

  // Tank size closeness
  if (profile.tankSize) {
    const range = tankSizeRanges[profile.tankSize];
    const minTank = product.specifications.compatibility.minTankSize ?? range.min ?? 0;
    const maxTank = product.specifications.compatibility.maxTankSize ?? range.max ?? minTank + 80;
    const target = range.max ?? range.min ?? maxTank;
    const mid = (minTank + maxTank) / 2;
    const diff = Math.abs((target ?? mid) - mid);
    score += Math.max(0, 30 - diff);
  }

  // Style alignment (soft boost to keep recommendations flowing)
  if (profile.style) {
    const category = product.category.toLowerCase();
    const subcategory = product.subcategory.toLowerCase();
    const isPlanted = category.includes('plant') || subcategory.includes('plant');
    const isNanoFriendly =
      (product.specifications.compatibility.maxTankSize ?? 0) <= 80 ||
      profile.tankSize === 'nano';
    if (profile.style === 'planted' && isPlanted) score += 12;
    if (profile.style === 'nano' && isNanoFriendly) score += 10;
    if (profile.style === 'showcase' && product.isBestSeller) score += 8;
  }

  if (profile.bioload) {
    const bioloadWeight = profile.bioload === 'high' ? 6 : profile.bioload === 'medium' ? 4 : 2;
    score += bioloadWeight;
  }

  if (product.isNew) score += 4;
  if (product.ecoFriendly) score += 3;

  return score;
};

const computeResult = (answers: Record<number, string>, products: Product[]): FishFinderResult => {
  const profile = normalizeProfile(answers);
  const scored = products
    .map((product) => ({
      product,
      score: scoreProduct(product, profile),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    products: scored.map((entry) => entry.product),
    reasoning:
      'Based on your tank size, experience, and style preferences we pulled your best matches.',
  };
};

export function FishFinderWizard({ products }: FishFinderWizardProps) {
  const t = useTranslations('fishFinder');
  const locale = useLocale() as Locale;
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<FishFinderResult | null>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const totalSteps = STEPS.length + 1; // includes result view

  useEffect(() => {
    const stored = parseStoredState();
    if (stored) {
      setCurrentStep(stored.currentStep ?? 1);
      setAnswers(stored.answers ?? {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state: StoredState = {
      currentStep,
      answers,
      resultIds: result?.products.map((p) => p.id),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [answers, currentStep, result]);

  useEffect(() => {
    if (currentStep === STEPS.length + 1) {
      setResult(computeResult(answers, products));
    }
  }, [answers, currentStep, products]);

  useGSAP(
    (ctx) => {
      ctx.add(() => {
        if (!stepContainerRef.current) return;
        gsap.fromTo(
          stepContainerRef.current.querySelectorAll('[data-step-card]'),
          { opacity: 0, y: 20, x: 8 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.05,
          },
        );
      });
    },
    { dependencies: [currentStep] },
  );

  const progress = Math.min((currentStep / totalSteps) * 100, 100);
  const step = STEPS.find((s) => s.id === currentStep);

  const handleSelect = (option: FishFinderOption) => {
    setAnswers((prev) => ({ ...prev, [currentStep]: option.value }));
  };

  const goToNext = () => setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  const goToPrev = () => setCurrentStep((prev) => Math.max(1, prev - 1));
  const reset = () => {
    setAnswers({});
    setResult(null);
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const canContinue = step ? Boolean(answers[currentStep]) : true;

  return (
    <div className="space-y-6 rounded-3xl border bg-background/80 p-6 shadow-xl" ref={stepContainerRef}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {t('title')}
          </p>
          <h2 className="text-2xl font-bold">
            {step ? t(step.question) : t('results.title')}
          </h2>
          {step?.helper && (
            <p className="text-sm text-muted-foreground">{t(step.helper)}</p>
          )}
          {!step && <p className="text-sm text-muted-foreground">{t('results.subtitle')}</p>}
        </div>
        <div className="min-w-[180px]">
          <Progress value={progress} />
          <p className="mt-1 text-xs text-muted-foreground">
            {currentStep}/{totalSteps}
          </p>
        </div>
      </div>

      {step ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-step-card>
          {step.options.map((option) => {
            const isActive = answers[currentStep] === option.value;
            return (
              <Card
                key={option.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(option)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(option)}
                className={cn(
                  'h-full cursor-pointer border bg-background/70 p-4 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
                  isActive && 'border-aqua-500 shadow-xl ring-2 ring-aqua-500/40',
                )}
                data-step-card
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold">{option.label}</span>
                    {step.helper && (
                      <p className="text-xs text-muted-foreground">{t(step.helper)}</p>
                    )}
                  </div>
                  {isActive && <Icon name="check" size="sm" className="text-aqua-600" />}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4" data-step-card>
          {result?.products.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {result.products.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {product.brand}
                      </p>
                      <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {product.description}
                      </p>
                    </div>
                    {product.difficulty && <DifficultyBadge level={product.difficulty} />}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(product.price, locale)}
                    </span>
                    {product.specifications.compatibility.displayText && (
                      <span className="text-muted-foreground">
                        {product.specifications.compatibility.displayText}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/products/${product.slug}`}>
                        <Icon name="eye" size="sm" className="me-2" />
                        {t('results.cta')}
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCurrentStep(1);
                        setAnswers({});
                        setResult(null);
                      }}
                    >
                      {t('restart')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('results.emptyHint')}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" disabled={currentStep === 1} onClick={goToPrev}>
          <Icon name="arrow-left" size="sm" className="me-2" />
          {t('previous')}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={reset}>
            <Icon name="refresh-ccw" size="sm" className="me-2" />
            {t('restart')}
          </Button>
          {currentStep < STEPS.length + 1 ? (
            <Button disabled={!canContinue} onClick={goToNext}>
              {t('next')}
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(1)}>{t('start')}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
