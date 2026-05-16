'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewChat: () => void;
  onStopGeneration: () => void;
  onFocusInput: () => void;
  isGenerating: boolean;
}

export function useKeyboardShortcuts({
  onNewChat,
  onStopGeneration,
  onFocusInput,
  isGenerating,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'k') {
        e.preventDefault();
        onNewChat();
      }

      if (e.key === 'Escape' && isGenerating) {
        e.preventDefault();
        onStopGeneration();
      }

      if (e.key === '/' && !meta && !isInputFocused()) {
        e.preventDefault();
        onFocusInput();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewChat, onStopGeneration, onFocusInput, isGenerating]);
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLInputElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}
