'use client';

import { useRef, KeyboardEvent, RefObject } from 'react';
import { Send, Square, Lightbulb, Hammer, ArrowUp } from 'lucide-react';
import { ChatMode } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, mode?: ChatMode) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  inputRef,
  chatMode,
  onModeChange,
}: ChatInputProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const activeRef = inputRef || localRef;

  function handleSend() {
    const el = activeRef.current;
    const value = el?.value.trim();
    if (!value || isGenerating) return;
    onSend(value, chatMode);
    if (el) {
      el.value = '';
      el.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = activeRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  const isPlan = chatMode === 'plan';

  return (
    <div className="shrink-0 border-t bg-background px-3 py-3">
      <div className={cn(
        'rounded-xl border bg-muted/30 transition-colors',
        isPlan ? 'border-blue-500/20' : 'border-border/60',
      )}>
        {/* Textarea */}
        <textarea
          ref={activeRef as RefObject<HTMLTextAreaElement>}
          placeholder={
            isPlan
              ? 'Describe what you want to plan...'
              : 'Ask the team to bring your idea to life'
          }
          className={cn(
            'w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none',
            'min-h-[60px] max-h-[200px]',
          )}
          rows={2}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
        />

        {/* Bottom bar: mode toggle + send button */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          {/* Mode toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onModeChange('plan')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                isPlan
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                  : 'text-muted-foreground/60 hover:bg-muted hover:text-foreground'
              )}
            >
              <Lightbulb className="h-3 w-3" />
              Plan
            </button>
            <button
              onClick={() => onModeChange('build')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                !isPlan
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
                  : 'text-muted-foreground/60 hover:bg-muted hover:text-foreground'
              )}
            >
              <Hammer className="h-3 w-3" />
              Build
            </button>
          </div>

          {/* Send / Stop button */}
          {isGenerating ? (
            <button
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-40',
                isPlan
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-foreground text-background hover:opacity-80'
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
