'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function CatchFishGame() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({ x: Math.random() * 80 + 10, y: Math.random() * 50 + 20 });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleCatch = () => {
    setScore((prev) => prev + 1);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
  };

  return (
    <div className="relative mt-6 h-52 w-full overflow-hidden rounded-2xl border bg-sky-950/70 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(0,217,255,0.15),transparent_30%)]" />
      <div className="relative z-10 flex items-center justify-between px-4 py-2 text-sm">
        <span>Catch the fish! 🎣</span>
        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">Score: {score}</span>
      </div>
      <button
        type="button"
        onClick={handleCatch}
        className="absolute text-4xl drop-shadow-lg transition-transform active:scale-90"
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
      >
        🐟
      </button>
    </div>
  );
}
