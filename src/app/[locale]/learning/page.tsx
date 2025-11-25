import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Button, Icon, Badge } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { getAllBlogPosts } from '@/lib/blog/mdx-utils';

type PageProps = {
  params: { locale: string };
};

export const metadata: Metadata = {
  title: 'Learning Center | Fish Web',
  description: 'Guides, articles, videos, and Q&A for aquarists in Iraq.',
};

const VIDEO_LIBRARY = [
  {
    id: 'intro-cycle',
    titleEn: 'Cycling your first aquarium',
    titleAr: 'دورة تجهيز الحوض (Cycling)',
    duration: '4:12',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'plants-care',
    titleEn: 'Plant care 101',
    titleAr: 'أساسيات العناية بالنباتات',
    duration: '5:40',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'water-clarity',
    titleEn: 'Crystal clear water',
    titleAr: 'وصول لماء صافي',
    duration: '3:25',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

export default async function LearningPage({ params }: PageProps) {
  setRequestLocale(params.locale);
  const isAr = params.locale === 'ar';
  const posts = await getAllBlogPosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-aqua-600 via-sky-600 to-blue-600 px-6 py-10 text-white shadow-xl sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-white/15 text-white">
              {isAr ? 'مركز التعلّم والمدونة' : 'Learning & Blog'}
            </Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">
              {isAr ? 'أدلة، مقالات، وفيديوهات بالعربي والإنجليزي' : 'Guides, articles, and videos in Arabic & English'}
            </h1>
            <p className="max-w-3xl text-white/85">
              {isAr
                ? 'كل ما تحتاجه للعناية بالأحواض: خطوات عملية، فيديوهات قصيرة، وإجابات سريعة من المجتمع وفريقنا.'
                : 'Everything you need for healthy tanks: practical steps, bite-sized videos, and quick answers from the community and our team.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="lg">
                <Link href="/blog">
                  <Icon name="book" className="me-2 h-4 w-4" aria-hidden />
                  {isAr ? 'أحدث المقالات' : 'Latest articles'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-white">
                <Link href="/learning/qa">
                  <Icon name="help" className="me-2 h-4 w-4" aria-hidden />
                  {isAr ? 'الأسئلة والأجوبة' : 'Q&A Forum'}
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl bg-white/10 p-4 text-sm backdrop-blur sm:w-80">
            <StatsLine
              label={isAr ? 'أدلة العناية' : 'Care guides'}
              value={isAr ? 'خطوات سهلة بالعربي' : 'Step-by-step, bilingual'}
            />
            <StatsLine
              label={isAr ? 'وصفات علاج' : 'Fix my tank'}
              value={isAr ? 'حلول سريعة للمشاكل' : 'Rapid fixes for issues'}
            />
            <StatsLine
              label={isAr ? 'فيديوهات قصيرة' : 'Short videos'}
              value={isAr ? 'أقل من 6 دقائق' : '< 6 minutes each'}
            />
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="book" className="h-5 w-5 text-aqua-600" />
            <h2 className="text-2xl font-semibold text-foreground">
              {isAr ? 'أدلة العناية ومقالات' : 'Care guides & articles'}
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/blog">
              {isAr ? 'عرض الكل' : 'View all'}
              <Icon name="arrow-right" className="ms-2 h-4 w-4" flipRtl />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4 text-muted-foreground">
              {isAr ? 'لا توجد مقالات حالياً.' : 'No articles yet.'}
            </div>
          )}
          {latestPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="clock" className="h-4 w-4" aria-hidden />
                <span>
                  {new Intl.DateTimeFormat(isAr ? 'ar-IQ' : 'en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(post.publishedAt))}
                </span>
                <span className="mx-2 h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{post.readingTime} {isAr ? 'دقيقة' : 'min'}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-aqua-600">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-aqua-600">
                <Link href={`/blog/${post.slug}`}>
                  {isAr ? 'اقرأ المزيد' : 'Read guide'}
                </Link>
                <Icon name="arrow-right" className="h-4 w-4" flipRtl />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="play" className="h-5 w-5 text-aqua-600" />
          <h2 className="text-2xl font-semibold text-foreground">
            {isAr ? 'فيديوهات سريعة' : 'Quick videos'}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEO_LIBRARY.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{isAr ? 'فيديو' : 'Video'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  <Icon name="clock" className="h-3 w-3" aria-hidden />
                  {video.duration}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-aqua-600">
                {isAr ? video.titleAr : video.titleEn}
              </h3>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-aqua-600">
                {isAr ? 'شاهد الآن' : 'Watch now'}
                <Icon name="arrow-right" className="h-4 w-4" flipRtl />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-card to-aqua-50/40 p-6 shadow-sm dark:from-sand-900/40 dark:to-aqua-900/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {isAr ? 'منتدى الأسئلة والأجوبة' : 'Community Q&A'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'اطرح سؤالاً أو استكشف إجابات تم تنسيقها من فريق الدعم والمجتمع.'
                : 'Ask a question or browse curated answers from our support team and community.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary" size="lg">
              <Link href="/learning/qa">
                <Icon name="help" className="me-2 h-4 w-4" aria-hidden />
                {isAr ? 'اذهب للأسئلة' : 'Go to Q&A'}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/support">
                <Icon name="whatsapp" className="me-2 h-4 w-4" aria-hidden />
                {isAr ? 'تواصل مع الدعم' : 'Contact support'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatsLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2">
      <span className="text-sm text-white/85">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
