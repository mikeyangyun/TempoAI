'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ParseResult } from '@/types';
import { parseHtmlFence } from '@/lib/parser';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentHtml: string | null;
  streamingContent: string;
  lastParseResult: ParseResult | null;
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setCurrentHtml: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isGenerating) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsGenerating(true);
      setStreamingContent('');
      setLastParseResult(null);

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages([...updatedMessages, assistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            currentHtml,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update streaming content for preview panel
          setStreamingContent(fullContent);

          // Update the assistant message progressively
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: fullContent,
              };
            }
            return updated;
          });
        }

        // Parse the final response for HTML
        const result = parseHtmlFence(fullContent);
        setLastParseResult(result);

        if (result.status === 'complete') {
          setCurrentHtml(result.html);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // User cancelled — update the message to show it was stopped
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              const existing = updated[lastIdx].content;
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: existing || '[Generation stopped by user]',
              };
            }
            return updated;
          });
        } else {
          const errorMsg =
            error instanceof Error ? error.message : 'An error occurred';
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: `[Error: ${errorMsg}]`,
              };
            }
            return updated;
          });
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isGenerating, currentHtml]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    lastParseResult,
    sendMessage,
    stopGeneration,
    setMessages,
    setCurrentHtml,
  };
}
