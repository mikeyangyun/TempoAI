'use client';

import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
          <MessageContent content={message.content} isUser={isUser} />
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  const parts = splitCodeBlocks(content);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100 dark:bg-zinc-950"
            >
              <code>{part.content}</code>
            </pre>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part.content}
          </span>
        );
      })}
    </div>
  );
}

type ContentPart = { type: 'text' | 'code'; content: string };

function splitCodeBlocks(text: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /```[\w]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}
