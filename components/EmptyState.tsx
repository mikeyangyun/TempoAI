'use client';

import { TempoLogo } from '@/components/TempoLogo';
import {
  ListTodo,
  Calculator,
  Globe,
  Palette,
  Timer,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  {
    icon: ListTodo,
    title: 'Todo App',
    description: 'Task manager with CRUD',
    prompt: 'Build a todo app with add, mark complete, and delete functionality. Use a clean modern design.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10 group-hover:bg-violet-500/20',
  },
  {
    icon: Calculator,
    title: 'Calculator',
    description: 'Functional calculator',
    prompt: 'Create a calculator app that supports basic arithmetic (+, -, ×, ÷) with a nice button layout.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
  },
  {
    icon: Globe,
    title: 'Landing Page',
    description: 'Modern SaaS page',
    prompt: 'Build a modern landing page for a SaaS product called "FlowSync" — include hero, features section, and CTA.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
  },
  {
    icon: Palette,
    title: 'Color Picker',
    description: 'Interactive palette tool',
    prompt: 'Make an interactive color picker that shows hex/rgb values, has a palette of presets, and lets you copy colors.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Focus timer with cycles',
    prompt: 'Build a Pomodoro timer with 25min work / 5min break cycles, start/pause/reset controls, and a progress ring.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
  },
  {
    icon: Cloud,
    title: 'Weather Card',
    description: 'Weather display UI',
    prompt: 'Create a beautiful weather card UI showing temperature, condition icon, humidity, and a 5-day forecast with mock data.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
  },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 py-10">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 h-[300px] w-[400px] rounded-full bg-gradient-to-br from-violet-500/5 via-blue-500/3 to-transparent blur-3xl dark:from-violet-500/10 dark:via-blue-500/5" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <TempoLogo size="md" className="mx-auto mb-3" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            What do you want to{' '}
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
              build
            </span>
            ?
          </h2>
          <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
            Describe your idea below, or pick a template to get started
          </p>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 gap-2 animate-fade-in-up-delay-1">
          {SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.title}
                onClick={() => onSelectPrompt(suggestion.prompt)}
                className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3.5 py-3 text-left transition-all duration-200 hover:border-border hover:bg-card hover:shadow-sm"
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                  suggestion.bg,
                )}>
                  <Icon className={cn('h-4 w-4', suggestion.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                    {suggestion.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">
                    {suggestion.description}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-center text-[10px] text-muted-foreground/30 animate-fade-in-up-delay-2">
          Powered by Tempo AI Sprint Team — BA, TL, UI/UX, Dev, QA
        </p>
      </div>
    </div>
  );
}
