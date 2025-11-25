'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

type Question = {
  id: string;
  author: string;
  question: string;
  answer?: string;
  createdAt: string;
};

function createSeedQuestions(t: ReturnType<typeof useTranslations>): Question[] {
  return [
    {
      id: 'seed-1',
      author: t('qa.seed.1.author'),
      question: t('qa.seed.1.question'),
      answer: t('qa.seed.1.answer'),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-2',
      author: t('qa.seed.2.author'),
      question: t('qa.seed.2.question'),
      answer: t('qa.seed.2.answer'),
      createdAt: new Date().toISOString(),
    },
  ];
}

export interface ProductQAProps {
  className?: string;
}

export function ProductQA({ className }: ProductQAProps) {
  const t = useTranslations('pdp.qa');
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [email, setEmail] = useState('');
  const seed = useMemo(() => createSeedQuestions(t), [t]);
  const [questions, setQuestions] = useState<Question[]>(seed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !question.trim()) {
      setMessage(t('errors.required'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setQuestions((prev) => [
        {
          id: crypto.randomUUID(),
          author: name.trim(),
          question: question.trim(),
          answer: undefined,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setName('');
      setQuestion('');
      setEmail('');
      setMessage(t('success.submitted'));
      setIsSubmitting(false);
    }, 350);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-foreground">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form
        className="space-y-3 rounded-lg border border-border bg-muted/40 p-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('form.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('form.namePlaceholder')}
          />
          <Input
            label={t('form.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('form.emailPlaceholder')}
            type="email"
          />
        </div>
        <Input
          label={t('form.question')}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t('form.questionPlaceholder')}
        />
        {message && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Icon name="alert" size="sm" aria-hidden />
            <span>{message}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t('form.disclaimer')}
          </p>
          <Button type="submit" size="sm" loading={isSubmitting}>
            <Icon name="help" size="sm" />
            {t('form.submit')}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
            {t('empty')}
          </div>
        ) : (
          questions.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card/70 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="message-circle" size="sm" />
                <span className="font-semibold text-foreground">{item.author}</span>
                <span aria-hidden>•</span>
                <time dateTime={item.createdAt}>
                  {t('asked')}
                </time>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {item.question}
              </p>
              {item.answer ? (
                <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                  <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-aqua-600">
                    <Icon name="shield-check" size="sm" />
                    {t('answerFromTeam')}
                  </div>
                  <p>{item.answer}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('pendingAnswer')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
