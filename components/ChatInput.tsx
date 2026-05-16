'use client';

import { useRef, useCallback, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isGenerating, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim();
    if (!value || isGenerating) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
  }, [onSend, isGenerating]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  return (
    <div className="flex items-end gap-2 border-t bg-background p-4">
      <Textarea
        ref={textareaRef}
        placeholder="Describe the app you want to build..."
        className="min-h-[44px] max-h-[200px] resize-none text-sm"
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
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
