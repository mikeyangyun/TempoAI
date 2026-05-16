'use client';

import { Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  {
    title: 'Todo App',
    description: 'A task manager with add, complete, and delete',
    prompt: 'Build a todo app with add, mark complete, and delete functionality. Use a clean modern design.',
  },
  {
    title: 'Calculator',
    description: 'A functional calculator with basic operations',
    prompt: 'Create a calculator app that supports basic arithmetic (+, -, ×, ÷) with a nice button layout.',
  },
  {
    title: 'Landing Page',
    description: 'A modern product landing page',
    prompt: 'Build a modern landing page for a SaaS product called "FlowSync" — include hero, features section, and CTA.',
  },
  {
    title: 'Color Picker',
    description: 'An interactive color palette tool',
    prompt: 'Make an interactive color picker that shows hex/rgb values, has a palette of presets, and lets you copy colors.',
  },
  {
    title: 'Pomodoro Timer',
    description: 'A focus timer with work/break cycles',
    prompt: 'Build a Pomodoro timer with 25min work / 5min break cycles, start/pause/reset controls, and a progress ring.',
  },
  {
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
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">What do you want to build?</h2>
        <p className="text-sm text-muted-foreground">
          Describe your app or pick a suggestion below
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className="group flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent hover:border-primary/30"
          >
            <span className="text-sm font-medium group-hover:text-primary transition-colors">
              {suggestion.title}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {suggestion.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
