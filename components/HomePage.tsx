'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  ArrowUp,
  FileText,
  Image,
  Gamepad2,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Zap,
  Globe,
  Sparkles,
  Lightbulb,
  Hammer,
} from 'lucide-react';
import { TempoLogo } from '@/components/TempoLogo';
import { ChatMode } from '@/types';
import { cn } from '@/lib/utils';

const PROMPT_PILLS = [
  {
    icon: FileText,
    label: 'Contact Form',
    prompt:
      'Build a modern contact form with name, email, subject, and message fields. Include form validation, a submit button with loading state, and a success confirmation animation.',
  },
  {
    icon: Image,
    label: 'Image Editor',
    prompt:
      'Create an image editor with upload, crop, rotate, brightness/contrast adjustment sliders, and a download button. Use canvas for image manipulation.',
  },
  {
    icon: Gamepad2,
    label: 'Mini Game',
    prompt:
      'Build a Snake game with arrow key controls, score tracking, speed increase on each food eaten, and a game over screen with restart button.',
  },
  {
    icon: DollarSign,
    label: 'Finance Calculator',
    prompt:
      'Create a finance calculator that computes compound interest, monthly payments, and total cost for loans. Include sliders for amount, rate, and term with a real-time chart visualization.',
  },
  {
    icon: BarChart3,
    label: 'Dashboard',
    prompt:
      'Build an analytics dashboard with cards for key metrics (revenue, users, orders), a bar chart, a line chart, and a recent activity table. Use mock data with a clean modern design.',
  },
  {
    icon: ShoppingCart,
    label: 'E-commerce',
    prompt:
      'Create a product listing page with a grid of product cards (image, title, price, rating), a search bar, category filters, and an add-to-cart button with a cart counter.',
  },
];

const STATS = [
  { icon: Zap, label: 'Instant generation', value: '< 10s' },
  { icon: Globe, label: 'Multi-file output', value: 'HTML + CSS + JS' },
  { icon: Sparkles, label: 'AI-powered', value: 'Smart agents' },
];

interface HomePageProps {
  onSend: (content: string, mode?: ChatMode) => void;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function HomePage({ onSend, chatMode, onModeChange }: HomePageProps) {
  const [inputValue, setInputValue] = useState('');
  const [focusedPill, setFocusedPill] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isPlan = chatMode === 'plan';

  // Rotate pill highlight
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusedPill((prev) => (prev + 1) % PROMPT_PILLS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value) return;
    onSend(value, chatMode);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePillClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-br from-violet-500/8 via-blue-500/6 to-cyan-500/4 blur-3xl dark:from-violet-500/15 dark:via-blue-500/10 dark:to-cyan-500/5" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-rose-500/5 to-orange-500/3 blur-3xl dark:from-rose-500/10 dark:to-orange-500/5" />
        <div className="absolute top-[20%] -left-[5%] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-emerald-500/4 to-teal-500/3 blur-3xl dark:from-emerald-500/8 dark:to-teal-500/5" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl space-y-10">
        {/* Hero section */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <TempoLogo size="lg" animated className="mx-auto mb-5" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            What do you want to{' '}
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              create
            </span>
            ?
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Describe your idea in natural language. Tempo AI will generate a fully
            interactive web app with real code — instantly.
          </p>
        </div>

        {/* Input box */}
        <div className="relative group animate-fade-in-up-delay-1">
          {/* Glow behind input */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
          <div className={cn(
            'relative rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg shadow-black/[0.03] dark:shadow-black/[0.15] focus-within:ring-2 transition-all duration-300',
            isPlan
              ? 'focus-within:ring-blue-500/20 focus-within:border-blue-500/30'
              : 'focus-within:ring-violet-500/20 focus-within:border-violet-500/30'
          )}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={isPlan ? 'Describe what you want to plan...' : 'Describe the app you want to build...'}
              className="w-full resize-none bg-transparent px-5 pt-5 pb-14 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[110px] max-h-[160px]"
              rows={3}
            />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <button
                onClick={() => onModeChange('plan')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                  isPlan
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
                )}
              >
                <Lightbulb className="h-3 w-3" />
                Plan
              </button>
              <button
                onClick={() => onModeChange('build')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                  !isPlan
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
                )}
              >
                <Hammer className="h-3 w-3" />
                Build
              </button>
            </div>
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-all hover:shadow-lg hover:scale-105 disabled:opacity-20 disabled:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed',
                  isPlan
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/20 hover:shadow-blue-500/30'
                    : 'bg-gradient-to-r from-violet-600 to-blue-600 shadow-violet-500/20 hover:shadow-violet-500/30'
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Prompt pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in-up-delay-2">
          {PROMPT_PILLS.map((pill, idx) => {
            const Icon = pill.icon;
            const isHighlighted = idx === focusedPill;
            return (
              <button
                key={pill.label}
                onClick={() => handlePillClick(pill.prompt)}
                onMouseEnter={() => setFocusedPill(idx)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs transition-all duration-300 ${
                  isHighlighted
                    ? 'border-violet-500/30 bg-violet-500/5 text-foreground shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10'
                    : 'border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/20'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors duration-300 ${
                    isHighlighted ? 'text-violet-500 dark:text-violet-400' : ''
                  }`}
                />
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 pt-4 animate-fade-in-up-delay-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2 text-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/60">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
