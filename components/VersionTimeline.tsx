'use client';

import { useState } from 'react';
import { History, Clock, ChevronDown, RotateCcw } from 'lucide-react';
import { ProjectVersion } from '@/types';
import { cn } from '@/lib/utils';

interface VersionTimelineProps {
  versions: ProjectVersion[];
  currentIndex: number;
  onRestore: (index: number) => void;
}

export function VersionTimeline({ versions, currentIndex, onRestore }: VersionTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (versions.length === 0) return null;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
          'text-muted-foreground hover:bg-accent hover:text-foreground',
          isOpen && 'bg-accent text-foreground'
        )}
      >
        <History className="h-3.5 w-3.5" />
        <span>v{currentIndex + 1}</span>
        <span className="text-muted-foreground/60">/ {versions.length}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Version History
            </div>
            <div className="max-h-48 overflow-y-auto">
              {versions.map((version, idx) => (
                <button
                  key={`${version.timestamp}-${idx}`}
                  onClick={() => {
                    onRestore(idx);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                    idx === currentIndex
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left">
                    Version {idx + 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {formatTime(version.timestamp)}
                  </span>
                  {idx === currentIndex && (
                    <span className="ml-1 rounded bg-primary/20 px-1 py-0.5 text-[9px] font-semibold text-primary">
                      CURRENT
                    </span>
                  )}
                  {idx !== currentIndex && (
                    <RotateCcw className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
