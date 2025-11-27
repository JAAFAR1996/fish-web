'use client';

import { useEffect, useRef, useState } from 'react';

import { useMousePosition } from '@/hooks/useMousePosition';
import { FEATURES } from '@/lib/config/features';
import { cn } from '@/lib/utils';

type Bubble = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vy: number;
};

type BubbleTrailProps = {
  enabled?: boolean;
  className?: string;
  clickBurst?: boolean;
  playSound?: boolean;
  soundSrc?: string;
};

const createBubble = (x: number, y: number): Bubble => ({
  x,
  y,
  radius: 3 + Math.random() * 4,
  opacity: 0.6 + Math.random() * 0.3,
  vy: -0.7 - Math.random() * 0.6,
});

export function BubbleTrail({
  enabled = true,
  className,
  clickBurst = true,
  playSound = false,
  soundSrc,
}: BubbleTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, setBubbles] = useState<Bubble[]>([]);
  const mouse = useMousePosition({ throttleMs: 0, includeTouch: true });

  useEffect(() => {
    if (!enabled || !FEATURES.bubbleTrail) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 16, 2);
      lastTime = time;

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setBubbles((prev) => {
        const updated = prev
          .map((bubble) => ({
            ...bubble,
            y: bubble.y + bubble.vy * delta,
            opacity: bubble.opacity - 0.01 * delta,
          }))
          .filter((bubble) => bubble.opacity > 0.05);

        updated.forEach((bubble) => {
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 217, 255, ${bubble.opacity})`;
          ctx.fill();
        });
        return updated;
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !FEATURES.bubbleTrail || !mouse.isInside) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { relativeX, relativeY } = mouse;
    setBubbles((prev) => [
      ...prev,
      createBubble(relativeX * canvas.clientWidth, relativeY * canvas.clientHeight),
    ]);
  }, [enabled, mouse]);

  useEffect(() => {
    if (!enabled || !clickBurst || !FEATURES.bubbleTrail) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setBubbles((prev) => [
        ...prev,
        ...Array.from({ length: 8 }, () => createBubble(x, y + Math.random() * 12)),
      ]);

      if (playSound && soundSrc) {
        if (!audioRef.current) {
          audioRef.current = new Audio(soundSrc);
          audioRef.current.volume = 0.15;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => undefined);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [clickBurst, enabled, playSound, soundSrc]);

  if (!enabled || !FEATURES.bubbleTrail) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'pointer-events-none fixed inset-0 z-50 h-full w-full select-none opacity-70',
        className
      )}
    />
  );
}
