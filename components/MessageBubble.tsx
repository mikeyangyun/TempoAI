'use client';

import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { User, Bot, FileCode2, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1',
          isUser && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {!isUser && !message.content && isStreaming ? (
            <StreamingIndicator />
          ) : (
            <MessageContent content={message.content} isUser={isUser} hasCode={!!message.rawContent} />
          )}
          {isStreaming && message.content && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser, hasCode }: { content: string; isUser: boolean; hasCode: boolean }) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="space-y-2">
      <span className="whitespace-pre-wrap">{content}</span>
      {hasCode && <GeneratedAppCard />}
    </div>
  );
}

function GeneratedAppCard() {
  return (
    <div className="flex items-center gap-2.5 mt-2 rounded-lg border bg-background/50 px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
        <FileCode2 className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">App generated</p>
        <p className="text-[10px] text-muted-foreground">View in preview panel</p>
      </div>
      <Check className="h-4 w-4 text-green-500" />
    </div>
  );
}

function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="h-2 w-2 animate-pulse rounded-full bg-current opacity-60" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-current opacity-60 [animation-delay:150ms]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-current opacity-60 [animation-delay:300ms]" />
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block ml-0.5 h-4 w-0.5 animate-pulse bg-current opacity-70" />
  );
}
