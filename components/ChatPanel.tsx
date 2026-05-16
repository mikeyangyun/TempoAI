'use client';

import { useEffect, useRef, RefObject } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { ChatMessage } from '@/types';
import { StreamPhase } from '@/hooks/useChat';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  streamPhase?: StreamPhase;
  agentName?: string;
  streamingLineCount?: number;
}

export function ChatPanel({
  messages,
  isGenerating,
  onSend,
  onStop,
  inputRef,
  streamPhase = 'idle',
  agentName = '',
  streamingLineCount = 0,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat header - only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Chat</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Messages or Empty State */}
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSend} />
        ) : (
          <div className="py-4">
            {messages.map((msg) => {
              const isLastAssistant =
                isGenerating &&
                msg.role === 'assistant' &&
                msg.id === messages[messages.length - 1]?.id;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isLastAssistant}
                  streamPhase={isLastAssistant ? streamPhase : undefined}
                  agentName={isLastAssistant ? agentName : undefined}
                  streamingLineCount={isLastAssistant ? streamingLineCount : undefined}
                />
              );
            })}
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
