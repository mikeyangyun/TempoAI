'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/types';
import { Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function ChatPanel({
  messages,
  isGenerating,
  onSend,
  onStop,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Tempo AI</h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center px-4 py-20 text-center text-muted-foreground">
              <p className="text-sm">
                Describe the app you want to build and watch it come to life.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
      />
    </div>
  );
}
