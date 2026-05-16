'use client';

import { cn } from '@/lib/utils';

interface TempoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function TempoLogo({ size = 'sm', className, animated = false }: TempoLogoProps) {
  const sizeMap = {
    sm: { box: 'h-7 w-7', svg: 18 },
    md: { box: 'h-10 w-10', svg: 26 },
    lg: { box: 'h-14 w-14', svg: 34 },
  };

  const s = sizeMap[size];

  return (
    <div
      className={cn(
        s.box,
        'relative flex items-center justify-center rounded-xl',
        'bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500',
        'shadow-md shadow-violet-500/20 dark:shadow-violet-500/30',
        animated && 'animate-float',
        className
      )}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />

      <svg
        width={s.svg}
        height={s.svg}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Abstract tempo waveform — three bars with rhythm feel */}
        <rect x="4" y="12" width="4" height="12" rx="2" fill="white" opacity="0.7">
          {animated && (
            <animate
              attributeName="height"
              values="12;18;12"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0s"
            />
          )}
          {animated && (
            <animate
              attributeName="y"
              values="12;9;12"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0s"
            />
          )}
        </rect>
        <rect x="11" y="6" width="4" height="20" rx="2" fill="white" opacity="0.9">
          {animated && (
            <animate
              attributeName="height"
              values="20;10;20"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0.2s"
            />
          )}
          {animated && (
            <animate
              attributeName="y"
              values="6;11;6"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0.2s"
            />
          )}
        </rect>
        <rect x="18" y="8" width="4" height="16" rx="2" fill="white" opacity="0.85">
          {animated && (
            <animate
              attributeName="height"
              values="16;22;16"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0.4s"
            />
          )}
          {animated && (
            <animate
              attributeName="y"
              values="8;5;8"
              dur="1.2s"
              repeatCount="indefinite"
              begin="0.4s"
            />
          )}
        </rect>

        {/* Sparkle accent */}
        <circle cx="26" cy="8" r="2.5" fill="white" opacity="0.6">
          {animated && (
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="27.5" cy="6" r="1" fill="white" opacity="0.4" />
      </svg>
    </div>
  );
}
