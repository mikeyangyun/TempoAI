'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { StreamPhase, TeamProgress } from '@/hooks/useChat';
import {
  Check,
  ChevronUp,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Sparkles,
  Lightbulb,
  Play,
  Users,
  ClipboardList,
  Cpu,
  Palette,
  Code2,
  ShieldCheck,
  MessageCircleQuestion,
  Send,
  Rocket,
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamPhase?: StreamPhase;
  agentName?: string;
  streamingLineCount?: number;
  onImplementPlan?: (planContent: string) => void;
  teamProgress?: TeamProgress;
  onAnswerBA?: (answer: string) => void;
}

export function MessageBubble({
  message,
  isStreaming,
  streamPhase = 'idle',
  agentName = '',
  streamingLineCount = 0,
  onImplementPlan,
  teamProgress,
  onAnswerBA,
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
      teamProgress={teamProgress}
      onAnswerBA={onAnswerBA}
    />
  );
}

const ROLE_CONFIG: Record<string, { icon: typeof ClipboardList; color: string; gradient: string }> = {
  ba: { icon: ClipboardList, color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/20 to-orange-500/20' },
  tl: { icon: Cpu, color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/20 to-cyan-500/20' },
  uiux: { icon: Palette, color: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20' },
  dev: { icon: Code2, color: 'text-green-600 dark:text-green-400', gradient: 'from-green-500/20 to-emerald-500/20' },
  qa: { icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500/20 to-violet-500/20' },
};

const ROLE_ORDER = ['ba', 'tl', 'uiux', 'dev', 'qa'] as const;

interface AssistantMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamPhase: StreamPhase;
  agentName: string;
  streamingLineCount: number;
  onImplementPlan?: (planContent: string) => void;
  teamProgress?: TeamProgress;
  onAnswerBA?: (answer: string) => void;
}

function AssistantMessage({
  message,
  isStreaming,
  streamPhase,
  agentName,
  streamingLineCount,
  onImplementPlan,
  teamProgress,
  onAnswerBA,
}: AssistantMessageProps) {
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isPlannerAgent = agentName === 'Planner' || agentName.toLowerCase().includes('plan');
  const isSprintTeam = agentName === 'SprintTeam';
  const displayAgentName = isSprintTeam ? 'Sprint Team' : (agentName || 'Tempo');
  const agentRole = isSprintTeam ? 'Agile Development' : getAgentRole(agentName);

  const isComplete = !isStreaming && (!!message.rawContent || !!message.content);
  const showTeamSteps = isSprintTeam && teamProgress && teamProgress.phases.length > 0;
  const showLegacySteps = (isStreaming || message.rawContent) && !isPlannerAgent && !isSprintTeam;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImplement = () => {
    if (onImplementPlan && message.content) {
      onImplementPlan(`Implement the following plan:\n\n${message.content}`);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isSprintTeam
              ? 'bg-gradient-to-br from-violet-500/20 to-amber-500/20'
              : isPlannerAgent
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                : 'bg-gradient-to-br from-violet-500/20 to-blue-500/20'
          )}
        >
          {isSprintTeam ? (
            <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          ) : isPlannerAgent ? (
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
        {isSprintTeam && (
          <span className="ml-1 inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
            Sprint
          </span>
        )}
      </div>

      {/* Team sprint progress timeline */}
      {showTeamSteps && (
        <div className="ml-10 mb-3">
          <button
            onClick={() => setStepsExpanded(!stepsExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            {teamProgress.sprintComplete ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
              </div>
            )}
            <span className="font-medium">
              {teamProgress.sprintComplete
                ? 'Sprint complete — MVP shipped'
                : `Sprint in progress...`}
            </span>
            {stepsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/60" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>

          {stepsExpanded && (
            <div className="mt-3 space-y-0.5">
              <TeamTimeline
                teamProgress={teamProgress}
                isStreaming={!!isStreaming}
              />
            </div>
          )}
        </div>
      )}

      {/* BA Question Card */}
      {teamProgress?.baQuestions && teamProgress.baQuestions.length > 0 && !teamProgress.sprintComplete && (
        <div className="ml-10 mb-3">
          <QuestionCard
            questions={teamProgress.baQuestions}
            onAnswer={onAnswerBA}
            disabled={!!isStreaming}
          />
        </div>
      )}

      {/* Legacy collapsible steps (non-team mode) */}
      {showLegacySteps && (
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
                ? `Processed ${getStepCount(streamPhase, message, isPlannerAgent)} steps`
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

          {!message.content && isStreaming && !showTeamSteps && streamPhase === 'analyzing' && (
            <div className="ml-10 text-sm text-muted-foreground">
              <StreamingDots />
            </div>
          )}

          {!isStreaming && message.rawContent && (
            <div className="ml-10 mt-3">
              {teamProgress?.sprintComplete ? <SprintCompleteCard /> : <GeneratedAppCard />}
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

// --- Team Timeline ---

interface TeamTimelineProps {
  teamProgress: TeamProgress;
  isStreaming: boolean;
}

function TeamTimeline({ teamProgress, isStreaming }: TeamTimelineProps) {
  const { phases, activeRole } = teamProgress;

  const roleState = (role: string): 'pending' | 'active' | 'done' | 'fail' => {
    const rolePhases = phases.filter(p => p.role === role);
    if (rolePhases.length === 0) return 'pending';
    const last = rolePhases[rolePhases.length - 1];
    if (last.status === 'done' || last.status === 'pass') return 'done';
    if (last.status === 'fail') return 'fail';
    if (last.status === 'start' || last.status === 'fix' || last.status === 'question') return 'active';
    return 'pending';
  };

  const getRoleName = (role: string): string => {
    const match = phases.find(p => p.role === role);
    return match?.name || '';
  };

  const getRoleTitle = (role: string): string => {
    const match = phases.find(p => p.role === role);
    return match?.title || '';
  };

  return (
    <div className="relative">
      {ROLE_ORDER.map((role, idx) => {
        const state = roleState(role);
        const config = ROLE_CONFIG[role];
        const Icon = config.icon;
        const name = getRoleName(role);
        const title = getRoleTitle(role);
        const isLast = idx === ROLE_ORDER.length - 1;

        return (
          <div key={role} className="relative flex items-start gap-3 group">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[13px] top-[28px] w-0.5 h-[calc(100%-12px)]',
                  state === 'done' || state === 'fail'
                    ? 'bg-muted-foreground/20'
                    : state === 'active'
                      ? 'bg-gradient-to-b from-violet-500/40 to-transparent'
                      : 'bg-muted-foreground/10'
                )}
              />
            )}

            {/* Role icon */}
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 z-10',
                state === 'active'
                  ? `bg-gradient-to-br ${config.gradient} border-transparent shadow-sm`
                  : state === 'done'
                    ? 'bg-muted/50 border-muted-foreground/20'
                    : state === 'fail'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-muted/30 border-dashed border-muted-foreground/15'
              )}
            >
              {state === 'done' ? (
                <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
              ) : state === 'fail' ? (
                <span className="text-[10px] text-red-500 font-bold">!</span>
              ) : (
                <Icon className={cn('h-3.5 w-3.5', state === 'active' ? config.color : 'text-muted-foreground/30')} />
              )}
            </div>

            {/* Role info */}
            <div className={cn('flex-1 pb-4 min-w-0', state === 'pending' && 'opacity-40')}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[13px] font-semibold',
                  state === 'active' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {name || role.toUpperCase()}
                </span>
                {title && (
                  <span className="text-[11px] text-muted-foreground/60">{title}</span>
                )}

                {state === 'active' && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-[10px] text-violet-500/70 font-medium">Working...</span>
                  </div>
                )}

                {state === 'done' && (
                  <span className="text-[10px] text-muted-foreground/50">Done</span>
                )}

                {state === 'fail' && (
                  <span className="text-[10px] text-red-500/80 font-medium">Issues found</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Question Card (BA asks the user) ---

interface QuestionCardProps {
  questions: string[];
  onAnswer?: (answer: string) => void;
  disabled: boolean;
}

function QuestionCard({ questions, onAnswer, disabled }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (!answer.trim() || !onAnswer) return;
    onAnswer(answer.trim());
    setAnswer('');
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/10 bg-amber-500/[0.04]">
        <MessageCircleQuestion className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Mike has questions for you</span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {i + 1}
            </span>
            <span className="leading-relaxed">{q}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-amber-500/10 bg-amber-500/[0.02]">
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type your answer..."
            disabled={disabled}
            className="flex-1 rounded-lg border border-amber-500/20 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !answer.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            Answer
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Plan Card ---

interface PlanCardProps {
  content: string;
  isStreaming: boolean;
  onImplement: () => void;
  showImplement: boolean;
}

function PlanCard({ content, isStreaming, onImplement, showImplement }: PlanCardProps) {
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.06] overflow-hidden">
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

      <div className="px-4 py-3 text-sm leading-relaxed text-foreground/80">
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && <StreamingCursor />}
      </div>

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

// --- Helper components & functions ---

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
  if (message.rawContent) return 4;
  switch (phase) {
    case 'complete': return 4;
    case 'fixing': return 4;
    case 'validating': return 3;
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

  const phaseOrder = ['analyzing', 'routing', 'writing', 'validating', 'fixing', 'complete'];
  const phaseIdx = phaseOrder.indexOf(phase);

  const steps = [
    {
      id: 'analyze',
      text: 'Analyzing the user\'s request and determining the best approach.',
      done: phaseIdx > 0,
      active: phase === 'analyzing',
    },
    {
      id: 'route',
      text: `Routing to ${agentName || 'agent'} for code generation.`,
      done: phaseIdx > 1,
      active: phase === 'routing',
    },
    {
      id: 'write',
      text: phase === 'writing'
        ? `Writing code${lineCount > 0 ? ` — ${lineCount} lines generated` : '...'}`
        : 'Code generation complete.',
      done: phaseIdx > 2,
      active: phase === 'writing',
    },
    {
      id: 'validate',
      text: phase === 'validating'
        ? 'Reviewing code quality...'
        : 'Code quality verified.',
      done: phase === 'complete' || phase === 'fixing',
      active: phase === 'validating',
    },
    ...(phase === 'fixing' || (phase === 'complete' && phaseIdx >= 4)
      ? [
          {
            id: 'fix',
            text: phase === 'fixing'
              ? 'Fixing issues found during review...'
              : 'Issues resolved.',
            done: phase === 'complete',
            active: phase === 'fixing',
          },
        ]
      : []),
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

function SprintCompleteCard() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/[0.04] px-4 py-3 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
          <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">MVP Shipped</p>
          <p className="text-xs text-muted-foreground">Sprint complete — view in preview &rarr;</p>
        </div>
      </div>
    </div>
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
