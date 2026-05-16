'use client';

import { useEffect, useRef, RefObject } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { ChatMessage } from '@/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

export function ChatPanel({
  messages,
  isGenerating,
  onSend,
  onStop,
  inputRef,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages or Empty State */}
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSend} />
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={
                  isGenerating &&
                  msg.role === 'assistant' &&
                  msg.id === messages[messages.length - 1]?.id
                }
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        inputRef={inputRef}
      />
    </div>
  );
}
