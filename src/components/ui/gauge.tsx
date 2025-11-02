'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit: string;
  status: 'optimal' | 'adequate' | 'insufficient';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 120, height: 60 },
  md: { width: 160, height: 80 },
  lg: { width: 200, height: 100 },
};

const STATUS_COLORS = {
  optimal: '#10b981',
  adequate: '#eab308',
  insufficient: '#ef4444',
};

export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  unit,
  status,
  size = 'md',
  showValue = true,
  className,
}: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const dimensions = SIZE_MAP[size];
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [percentage]);

  const rotation = -90 + (animatedValue * 180) / 100;
  const radius = dimensions.width / 2 - 10;
  const circumference = Math.PI * radius;
  const arcLength = (animatedValue / 100) * circumference;

  const arcStyle: CSSProperties = {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: circumference - arcLength,
    '--gauge-arc-circumference': `${circumference}`,
    '--gauge-arc-target': `${circumference - arcLength}`,
  } as CSSProperties;

  const needleStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transformOrigin: `${dimensions.width / 2}px ${dimensions.height - 10}px`,
    '--gauge-needle-angle': `${rotation}deg`,
  } as CSSProperties;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <p className="text-sm font-medium text-sand-900 dark:text-sand-100">
        {label}
      </p>
      
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        role="img"
        aria-label={`${label}: ${value} ${unit}`}
      >
        <path
          d={`M 10 ${dimensions.height - 10} A ${radius} ${radius} 0 0 1 ${dimensions.width - 10} ${dimensions.height - 10}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        <path
          d={`M 10 ${dimensions.height - 10} A ${radius} ${radius} 0 0 1 ${dimensions.width - 10} ${dimensions.height - 10}`}
          fill="none"
          stroke={STATUS_COLORS[status]}
          strokeWidth="8"
          strokeLinecap="round"
          style={arcStyle}
          className="transition-all duration-800 ease-out motion-safe:animate-gauge-arc"
        />

        <line
          x1={dimensions.width / 2}
          y1={dimensions.height - 10}
          x2={dimensions.width / 2}
          y2={20}
          stroke="#374151"
          strokeWidth="2"
          style={needleStyle}
          className="transition-transform duration-800 ease-out motion-safe:animate-gauge-needle"
        />
      </svg>

      {showValue && (
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-sand-900 dark:text-sand-100">
            {value} <span className="text-base text-sand-600 dark:text-sand-400">{unit}</span>
          </p>
        </div>
      )}
    </div>
  );
}


