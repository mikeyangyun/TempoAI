'use client';

import { useRef, KeyboardEvent, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square, Lightbulb, Hammer } from 'lucide-react';
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
    <div className="border-t bg-background p-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => onModeChange('plan')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            isPlan
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Lightbulb className="h-3 w-3" />
          Plan
        </button>
        <button
          onClick={() => onModeChange('build')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            !isPlan
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Hammer className="h-3 w-3" />
          Build
        </button>
        <span className="ml-2 text-[10px] text-muted-foreground/50">
          {isPlan ? 'AI will outline a plan first' : 'AI will generate code'}
        </span>
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <Textarea
          ref={activeRef as RefObject<HTMLTextAreaElement>}
          placeholder={
            isPlan
              ? 'Describe what you want to plan...'
              : 'Describe the app you want to build...'
          }
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none text-sm transition-colors',
            isPlan && 'border-blue-500/20 focus-visible:ring-blue-500/20'
          )}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
        />
        {isGenerating ? (
          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled}
            className={cn(
              'shrink-0 transition-colors',
              isPlan && 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
