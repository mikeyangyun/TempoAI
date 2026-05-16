'use client';

import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { StreamPhase } from '@/hooks/useChat';
import {
  User,
  Bot,
  FileCode2,
  Check,
  Circle,
  Search,
  GitBranch,
  Code,
  Loader2,
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamPhase?: StreamPhase;
  agentName?: string;
  streamingLineCount?: number;
}

export function MessageBubble({
  message,
  isStreaming,
  streamPhase = 'idle',
  agentName = '',
  streamingLineCount = 0,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-3 px-4 py-3 flex-row-reverse">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="flex max-w-[80%] flex-col items-end">
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
            <span className="whitespace-pre-wrap">{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message — structured process layout
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Process steps — shown during streaming or after completion */}
        {(isStreaming || message.rawContent) && (
          <ProcessSteps
            phase={isStreaming ? streamPhase : 'complete'}
            agentName={agentName || (message.rawContent ? 'CodeGenerator' : '')}
            lineCount={streamingLineCount}
          />
        )}

        {/* AI's natural language text */}
        {message.content && (
          <div className="text-sm leading-relaxed text-foreground">
            <span className="whitespace-pre-wrap">{message.content}</span>
            {isStreaming && <StreamingCursor />}
          </div>
        )}

        {/* Waiting state — no content yet */}
        {!message.content && isStreaming && streamPhase === 'analyzing' && (
          <div className="text-sm text-muted-foreground">
            <StreamingDots />
          </div>
        )}

        {/* Generated app card — shown after completion */}
        {!isStreaming && message.rawContent && <GeneratedAppCard />}
      </div>
    </div>
  );
}

interface ProcessStepsProps {
  phase: StreamPhase;
  agentName: string;
  lineCount: number;
}

function ProcessSteps({ phase, agentName, lineCount }: ProcessStepsProps) {
  const steps = [
    {
      id: 'analyze',
      label: 'Analyzing request',
      icon: Search,
      done: phase !== 'idle' && phase !== 'analyzing',
      active: phase === 'analyzing',
    },
    {
      id: 'route',
      label: agentName ? `Using ${agentName}` : 'Selecting agent',
      icon: GitBranch,
      done: phase === 'writing' || phase === 'complete',
      active: phase === 'routing',
    },
    {
      id: 'write',
      label: phase === 'writing'
        ? `Writing code${lineCount > 0 ? ` (${lineCount} lines)` : '...'}`
        : phase === 'complete'
          ? 'Code generated'
          : 'Writing code',
      icon: Code,
      done: phase === 'complete',
      active: phase === 'writing',
    },
  ];

  return (
    <div className="space-y-1">
      {steps.map((step) => {
        if (!step.done && !step.active && phase === 'idle') return null;
        // Only show steps up to current phase
        if (!step.done && !step.active) return null;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {step.done ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : step.active ? (
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={cn(
                'text-xs',
                step.done
                  ? 'text-muted-foreground'
                  : step.active
                    ? 'text-muted-foreground font-medium'
                    : 'text-muted-foreground/40'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GeneratedAppCard() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2 max-w-xs">
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

function StreamingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground opacity-60" />
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground opacity-60 [animation-delay:150ms]" />
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground opacity-60 [animation-delay:300ms]" />
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block ml-0.5 h-4 w-0.5 animate-pulse bg-foreground/70" />
  );
}
