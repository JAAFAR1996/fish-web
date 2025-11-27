'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import type { JourneyStep } from '@/types';
import { cn } from '@/lib/utils';

type JourneyState = {
  currentStep: number;
  completed: number[];
};

const STORAGE_KEY = 'journey-progress';

export function JourneyPageClient() {
  const t = useTranslations('journey');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completed, setCompleted] = useState<number[]>([]);

  const steps: JourneyStep[] = useMemo(
    () => [
      {
        id: 1,
        title: t('step1'),
        description: t('descriptions.step1'),
        icon: '🐠',
        completed: completed.includes(1),
      },
      {
        id: 2,
        title: t('step2'),
        description: t('descriptions.step2'),
        icon: '🌿',
        completed: completed.includes(2),
      },
      {
        id: 3,
        title: t('step3'),
        description: t('descriptions.step3'),
        icon: '🐟',
        completed: completed.includes(3),
      },
      {
        id: 4,
        title: t('step4'),
        description: t('descriptions.step4'),
        icon: '⚙️',
        completed: completed.includes(4),
      },
    ],
    [completed, t],
  );

  // Load saved progress
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as JourneyState;
      setCurrentStep(parsed.currentStep ?? 1);
      setCompleted(parsed.completed ?? []);
    } catch {
      // ignore invalid state
    }
  }, []);

  // Persist progress
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state: JourneyState = { currentStep, completed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [completed, currentStep]);

  const goToStep = (stepId: number) => {
    const priorSteps = steps.filter((step) => step.id < stepId).map((step) => step.id);
    setCurrentStep(stepId);
    setCompleted((prev) => Array.from(new Set([...prev, ...priorSteps])));
  };

  const goNext = () => {
    setCompleted((prev) => Array.from(new Set([...prev, currentStep])));
    setCurrentStep((prev) => Math.min(steps.length, prev + 1));
  };

  const goPrev = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const reset = () => {
    setCurrentStep(1);
    setCompleted([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t('title')}</p>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
        <div className="flex justify-center gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" onClick={reset}>
            <Icon name="refresh-ccw" size="sm" className="me-2" />
            {t('reset')}
          </Button>
        </div>
      </header>

      <JourneyProgress
        steps={steps}
        currentStep={currentStep}
        onStepChange={goToStep}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" disabled={currentStep === 1} onClick={goPrev}>
          <Icon name="arrow-left" size="sm" className="me-2" />
          {t('previous')}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reset}>
            <Icon name="refresh-ccw" size="sm" className="me-2" />
            {t('reset')}
          </Button>
          <Button onClick={goNext}>
            {currentStep >= steps.length ? t('progress') : t('cta')}
          </Button>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {steps.map((step) => (
          <Card
            key={step.id}
            className={cn(
              'rounded-2xl border bg-background/80 p-5 shadow-sm transition',
              step.id === currentStep && 'border-aqua-500 shadow-lg',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {step.icon}
              </span>
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  {t('progress')}: {step.id}/{steps.length}
                </p>
                <h3 className="text-lg font-semibold">{step.title}</h3>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => goToStep(step.id)}>
                {step.id <= currentStep ? t('resume') : t('cta')}
              </Button>
              {step.id > 1 && (
                <Button size="sm" variant="ghost" onClick={() => goToStep(step.id - 1)}>
                  {t('previous')}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
