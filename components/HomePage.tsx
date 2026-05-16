'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Sparkles, ArrowUp, FileText, Image, Gamepad2, DollarSign, BarChart3, ShoppingCart } from 'lucide-react';

const PROMPT_PILLS = [
  {
    icon: FileText,
    label: 'Contact Form',
    prompt: 'Build a modern contact form with name, email, subject, and message fields. Include form validation, a submit button with loading state, and a success confirmation animation.',
  },
  {
    icon: Image,
    label: 'Image Editor',
    prompt: 'Create an image editor with upload, crop, rotate, brightness/contrast adjustment sliders, and a download button. Use canvas for image manipulation.',
  },
  {
    icon: Gamepad2,
    label: 'Mini Game',
    prompt: 'Build a Snake game with arrow key controls, score tracking, speed increase on each food eaten, and a game over screen with restart button.',
  },
  {
    icon: DollarSign,
    label: 'Finance Calculator',
    prompt: 'Create a finance calculator that computes compound interest, monthly payments, and total cost for loans. Include sliders for amount, rate, and term with a real-time chart visualization.',
  },
  {
    icon: BarChart3,
    label: 'Dashboard',
    prompt: 'Build an analytics dashboard with cards for key metrics (revenue, users, orders), a bar chart, a line chart, and a recent activity table. Use mock data with a clean modern design.',
  },
  {
    icon: ShoppingCart,
    label: 'E-commerce',
    prompt: 'Create a product listing page with a grid of product cards (image, title, price, rating), a search bar, category filters, and an add-to-cart button with a cart counter.',
  },
];

interface HomePageProps {
  onSend: (content: string) => void;
  onFillPrompt?: (prompt: string) => void;
}

export function HomePage({ onSend }: HomePageProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value) return;
    onSend(value);
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
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            What do you want to create?
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Tempo AI turns your ideas into interactive web apps. Describe what you need and watch it come to life.
          </p>
        </div>

        {/* Input box */}
        <div className="relative">
          <div className="rounded-2xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Describe the app you want to build..."
              className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[100px] max-h-[160px]"
              rows={3}
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Prompt pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PROMPT_PILLS.map((pill) => {
            const Icon = pill.icon;
            return (
              <button
                key={pill.label}
                onClick={() => handlePillClick(pill.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:border-primary/20 hover:shadow-sm"
              >
                <Icon className="h-3 w-3" />
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
