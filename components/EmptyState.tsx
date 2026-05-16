'use client';

import { Sparkles, ListTodo, Calculator, Globe, Palette, Timer, Cloud } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: ListTodo,
    title: 'Todo App',
    description: 'A task manager with add, complete, and delete',
    prompt: 'Build a todo app with add, mark complete, and delete functionality. Use a clean modern design.',
  },
  {
    icon: Calculator,
    title: 'Calculator',
    description: 'A functional calculator with basic operations',
    prompt: 'Create a calculator app that supports basic arithmetic (+, -, ×, ÷) with a nice button layout.',
  },
  {
    icon: Globe,
    title: 'Landing Page',
    description: 'A modern product landing page',
    prompt: 'Build a modern landing page for a SaaS product called "FlowSync" — include hero, features section, and CTA.',
  },
  {
    icon: Palette,
    title: 'Color Picker',
    description: 'An interactive color palette tool',
    prompt: 'Make an interactive color picker that shows hex/rgb values, has a palette of presets, and lets you copy colors.',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'A focus timer with work/break cycles',
    prompt: 'Build a Pomodoro timer with 25min work / 5min break cycles, start/pause/reset controls, and a progress ring.',
  },
  {
    icon: Cloud,
    title: 'Weather Card',
    description: 'A weather display component',
    prompt: 'Create a beautiful weather card UI showing temperature, condition icon, humidity, and a 5-day forecast with mock data.',
  },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          What do you want to build?
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Describe your app in natural language or pick a template below
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.title}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:bg-accent hover:border-primary/20 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {suggestion.title}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {suggestion.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
