'use client';

import { useState } from 'react';

import { Badge, Button, Icon, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export type QAItem = {
  question: string;
  answer: string;
  category: string;
  status?: 'answered' | 'pending';
};

interface QAClientProps {
  initialItems: QAItem[];
  isAr: boolean;
}

export function QAClient({ initialItems, isAr }: QAClientProps) {
  const [items, setItems] = useState<QAItem[]>(initialItems);
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(isAr ? 'عام' : 'General');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;

    const newItem: QAItem = {
      question: question.trim(),
      answer: isAr
        ? 'استلمنا سؤالك. سيرد فريق الدعم خلال ساعات العمل.'
        : 'We received your question. Support will answer during business hours.',
      category,
      status: 'pending',
    };

    setItems((prev) => [newItem, ...prev]);
    setQuestion('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3 rounded-3xl bg-gradient-to-br from-aqua-600 via-sky-600 to-blue-600 p-6 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          <Icon name="help" className="h-4 w-4" aria-hidden />
          <span>{isAr ? 'منتدى الأسئلة' : 'Community Q&A'}</span>
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {isAr ? 'اسأل، تعلّم، وشارك خبرتك' : 'Ask, learn, and share your experience'}
        </h1>
        <p className="text-white/85">
          {isAr
            ? 'إجابات من المجتمع وفريق Fish Web على مشاكل المياه، النباتات، والمعدات.'
            : 'Get answers from the community and our team on water, plants, and gear.'}
        </p>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <Input
            label={isAr ? 'السؤال' : 'Question'}
            mobileLabelInside
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question...'}
            required
          />
          <Input
            label={isAr ? 'التصنيف' : 'Category'}
            mobileLabelInside
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder={isAr ? 'عام، مياه، نباتات...' : 'General, water, plants...'}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            <Icon name="send" className="me-2 h-4 w-4" aria-hidden />
            {isAr ? 'إرسال' : 'Submit'}
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          {isAr ? 'أسئلة وإجابات' : 'Questions & answers'}
        </h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <article
              key={`${item.question}-${index}`}
              className={cn(
                'rounded-xl border border-border/60 bg-card p-4 shadow-sm',
                item.status === 'pending' && 'border-dashed'
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{item.category}</Badge>
                {item.status === 'pending' && (
                  <Badge variant="outline">
                    {isAr ? 'قيد الإجابة' : 'Pending answer'}
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {item.question}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
