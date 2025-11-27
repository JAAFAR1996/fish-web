'use client';

import { useEffect, useRef, useState } from 'react';

import { FEATURES } from '@/lib/config/features';
import { cn } from '@/lib/utils';

type ProductVideoProps = {
  src: string;
  poster?: string;
  subtitles?: string;
  className?: string;
  autoPlayOnView?: boolean;
};

export function ProductVideo({
  src,
  poster,
  subtitles,
  className,
  autoPlayOnView = true,
}: ProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!autoPlayOnView || typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => undefined);
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.35 },
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [autoPlayOnView]);

  if (!FEATURES.productVideos) return null;

  return (
    <div className={cn('overflow-hidden rounded-2xl bg-muted', className)}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={src}
        poster={poster}
        muted
        playsInline
        controls
        autoPlay={autoPlayOnView}
      >
        {subtitles && <track kind="subtitles" src={subtitles} srcLang="ar" default />}
      </video>
      {!isInView && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>Autoplay when visible</span>
          <span>15-30s</span>
        </div>
      )}
    </div>
  );
}
