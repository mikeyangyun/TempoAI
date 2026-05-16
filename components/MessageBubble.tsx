'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { StreamPhase } from '@/hooks/useChat';
import {
  Check,
  ChevronUp,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Sparkles,
  Lightbulb,
  Play,
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamPhase?: StreamPhase;
  agentName?: string;
  streamingLineCount?: number;
  onImplementPlan?: (planContent: string) => void;
}

export function MessageBubble({
  message,
  isStreaming,
  streamPhase = 'idle',
  agentName = '',
  streamingLineCount = 0,
  onImplementPlan,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-foreground/[0.06] dark:bg-foreground/10 px-4 py-2.5 text-sm leading-relaxed text-foreground">
          <span className="whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      streamPhase={streamPhase}
      agentName={agentName}
      streamingLineCount={streamingLineCount}
      onImplementPlan={onImplementPlan}
    />
  );
}

interface AssistantMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamPhase: StreamPhase;
  agentName: string;
  streamingLineCount: number;
  onImplementPlan?: (planContent: string) => void;
}

function AssistantMessage({
  message,
  isStreaming,
  streamPhase,
  agentName,
  streamingLineCount,
  onImplementPlan,
}: AssistantMessageProps) {
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isPlannerAgent = agentName === 'Planner' || agentName.toLowerCase().includes('plan');
  const displayAgentName = agentName || 'Tempo';
  const agentRole = getAgentRole(agentName);

  const stepCount = getStepCount(streamPhase, message, isPlannerAgent);
  const isComplete = !isStreaming && (!!message.rawContent || !!message.content);
  const showSteps = (isStreaming || message.rawContent) && !isPlannerAgent;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImplement = () => {
    if (onImplementPlan && message.content) {
      onImplementPlan(
        `Implement the following plan:\n\n${message.content}`
      );
    }
  };

  return (
    <div className="px-4 py-4">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isPlannerAgent
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
              : 'bg-gradient-to-br from-violet-500/20 to-blue-500/20'
          )}
        >
          {isPlannerAgent ? (
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        <span className="text-sm font-semibold text-foreground">{displayAgentName}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">{agentRole}</span>
        {isPlannerAgent && (
          <span className="ml-1 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            Plan
          </span>
        )}
      </div>

      {/* Collapsible process steps (Build mode only) */}
      {showSteps && (
        <div className="ml-10 mb-3">
          <button
            onClick={() => setStepsExpanded(!stepsExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            {isComplete ? (
              <Check className="h-4 w-4 text-muted-foreground" />
            ) : (
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
              </div>
            )}
            <span className="font-medium">
              {isComplete
                ? `Processed ${stepCount} steps`
                : `Processing${streamPhase === 'writing' ? ` (${streamingLineCount} lines)` : '...'}`}
            </span>
            {stepsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/60" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>

          {stepsExpanded && (
            <div className="mt-2 space-y-1.5">
              <ThinkingSteps
                streamPhase={streamPhase}
                isStreaming={!!isStreaming}
                agentName={agentName}
                lineCount={streamingLineCount}
              />
            </div>
          )}
        </div>
      )}

      {/* Plan card or regular content */}
      {isPlannerAgent && message.content ? (
        <div className="ml-10">
          <PlanCard
            content={message.content}
            isStreaming={!!isStreaming}
            onImplement={handleImplement}
            showImplement={!!onImplementPlan && !isStreaming}
          />
        </div>
      ) : (
        <>
          {message.content && (
            <div className="ml-10 text-sm leading-relaxed text-foreground/80">
              <span className="whitespace-pre-wrap">{message.content}</span>
              {isStreaming && <StreamingCursor />}
            </div>
          )}

          {!message.content && isStreaming && streamPhase === 'analyzing' && (
            <div className="ml-10 text-sm text-muted-foreground">
              <StreamingDots />
            </div>
          )}

          {!isStreaming && message.rawContent && (
            <div className="ml-10 mt-3">
              <GeneratedAppCard />
            </div>
          )}
        </>
      )}

      {/* Action bar */}
      {!isStreaming && message.content && (
        <div className="ml-10 mt-2 flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface PlanCardProps {
  content: string;
  isStreaming: boolean;
  onImplement: () => void;
  showImplement: boolean;
}

function PlanCard({ content, isStreaming, onImplement, showImplement }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.06] overflow-hidden">
      {/* Plan header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/10 bg-blue-500/[0.03]">
        <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Plan</span>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] text-blue-500/70">Thinking...</span>
          </div>
        )}
      </div>

      {/* Plan content */}
      <div className="px-4 py-3 text-sm leading-relaxed text-foreground/80">
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && <StreamingCursor />}
      </div>

      {/* Implement button */}
      {showImplement && (
        <div className="px-4 py-3 border-t border-blue-500/10 bg-blue-500/[0.02]">
          <button
            onClick={onImplement}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-violet-500/15 hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-3.5 w-3.5" />
            Implement this plan
          </button>
        </div>
      )}
    </div>
  );
}

function getAgentRole(agentName: string): string {
  const name = agentName.toLowerCase();
  if (name.includes('planner') || name.includes('plan')) return 'Architect';
  if (name.includes('modifier') || name.includes('modify')) return 'Code Modifier';
  if (name.includes('generator') || name.includes('generate')) return 'Code Generator';
  if (name.includes('orchestrator')) return 'Orchestrator';
  return 'Code Generator';
}

function getStepCount(phase: StreamPhase, message: ChatMessage, isPlan: boolean): number {
  if (isPlan) return message.content ? 1 : 0;
  if (message.rawContent) return 3;
  switch (phase) {
    case 'complete': return 3;
    case 'writing': return 2;
    case 'routing': return 1;
    case 'analyzing': return 0;
    default: return 0;
  }
}

interface ThinkingStepsProps {
  streamPhase: StreamPhase;
  isStreaming: boolean;
  agentName: string;
  lineCount: number;
}

function ThinkingSteps({ streamPhase, isStreaming, agentName, lineCount }: ThinkingStepsProps) {
  const phase = isStreaming ? streamPhase : 'complete';

  const steps = [
    {
      id: 'analyze',
      text: 'Analyzing the user\'s request and determining the best approach.',
      done: phase !== 'idle' && phase !== 'analyzing',
      active: phase === 'analyzing',
    },
    {
      id: 'route',
      text: `Routing to ${agentName || 'agent'} for code generation.`,
      done: phase === 'writing' || phase === 'complete',
      active: phase === 'routing',
    },
    {
      id: 'write',
      text: phase === 'writing'
        ? `Writing code${lineCount > 0 ? ` — ${lineCount} lines generated` : '...'}`
        : 'Code generation complete.',
      done: phase === 'complete',
      active: phase === 'writing',
    },
  ];

  return (
    <>
      {steps.map((step) => {
        if (!step.done && !step.active) return null;
        return (
          <div key={step.id} className="flex items-start gap-2.5">
            <div className="mt-1.5 shrink-0">
              {step.done ? (
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              )}
            </div>
            <span className="text-[13px] leading-relaxed text-muted-foreground">
              {step.text}
              {step.id === 'route' && agentName && (
                <code className="ml-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {agentName}
                </code>
              )}
            </span>
          </div>
        );
      })}
    </>
  );
}

function GeneratedAppCard() {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">App Generated</p>
          <p className="text-xs text-muted-foreground">View in the preview panel &rarr;</p>
        </div>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
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
