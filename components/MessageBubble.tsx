'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { StreamPhase, TeamProgress, RoleSegment, TeamPhaseInfo, BAQuestion, parseRoleSegments } from '@/hooks/useChat';
import {
  Check,
  ChevronRight,
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
  AlertTriangle,
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isGenerating?: boolean;
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
  isGenerating,
  streamPhase = 'idle',
  agentName = '',
  streamingLineCount = 0,
  onImplementPlan,
  teamProgress,
  onAnswerBA,
}: MessageBubbleProps) {
  if (message.role === 'user') {
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
      isGenerating={isGenerating}
      streamPhase={streamPhase}
      agentName={agentName}
      streamingLineCount={streamingLineCount}
      onImplementPlan={onImplementPlan}
      teamProgress={teamProgress}
      onAnswerBA={onAnswerBA}
    />
  );
}

const ROLE_CONFIG: Record<string, { icon: typeof ClipboardList; color: string; gradient: string; label: string }> = {
  ba: { icon: ClipboardList, color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/20 to-orange-500/20', label: 'Requirements' },
  tl: { icon: Cpu, color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/20 to-cyan-500/20', label: 'Architecture' },
  uiux: { icon: Palette, color: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20', label: 'Design' },
  dev: { icon: Code2, color: 'text-green-600 dark:text-green-400', gradient: 'from-green-500/20 to-emerald-500/20', label: 'Development' },
  qa: { icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500/20 to-violet-500/20', label: 'QA Testing' },
};

interface AssistantMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isGenerating?: boolean;
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
  isGenerating,
  streamPhase,
  agentName,
  streamingLineCount,
  onImplementPlan,
  teamProgress,
  onAnswerBA,
}: AssistantMessageProps) {
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const effectiveAgentName = agentName || message.agentName || '';
  const isPlannerAgent = effectiveAgentName === 'Planner' || effectiveAgentName.toLowerCase().includes('plan');
  const isSprintTeam = effectiveAgentName === 'SprintTeam';
  const displayAgentName = isSprintTeam ? 'Sprint Team' : (effectiveAgentName || 'Tempo');
  const agentRole = isSprintTeam ? 'Agile Development' : getAgentRole(effectiveAgentName);

  const resolvedTeamProgress = useMemo(() => {
    if (teamProgress && teamProgress.roleSegments.length > 0) return teamProgress;
    if (isSprintTeam && message.sprintRaw) {
      return rebuildTeamProgress(message.sprintRaw);
    }
    return null;
  }, [teamProgress, isSprintTeam, message.sprintRaw]);

  const showTeamCards = isSprintTeam && resolvedTeamProgress && resolvedTeamProgress.roleSegments.length > 0;
  const showLegacySteps = (isStreaming || message.rawContent) && !isPlannerAgent && !isSprintTeam;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImplement = (filteredPlan: string) => {
    if (onImplementPlan) {
      onImplementPlan(`Implement the following plan:\n\n${filteredPlan}`);
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

      {/* Sprint team: collapsible role cards */}
      {showTeamCards && resolvedTeamProgress && (
        <div className="ml-10 mb-3 space-y-1.5">
          {resolvedTeamProgress.roleSegments.map((seg, idx) => (
            <RoleCard
              key={`${seg.role}-${idx}`}
              segment={seg}
              isActive={resolvedTeamProgress.activeRole === seg.role && seg.status === 'active'}
            />
          ))}

          {/* BA Question Card */}
          {resolvedTeamProgress.baQuestions && resolvedTeamProgress.baQuestions.length > 0 && !resolvedTeamProgress.sprintComplete && (
            <QuestionCard
              questions={resolvedTeamProgress.baQuestions}
              onAnswer={onAnswerBA}
              disabled={!!isStreaming}
            />
          )}

          {/* BA Rejection Card */}
          {resolvedTeamProgress.baRejection && (
            <RejectionCard content={resolvedTeamProgress.baRejection} />
          )}

          {/* Waiting indicator when streaming but no segments yet for active role */}
          {isStreaming && resolvedTeamProgress.activeRole && !resolvedTeamProgress.sprintComplete && (
            <div className="flex items-center gap-2 pl-1 pt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground/60">
                {(() => {
                  const activeSeg = resolvedTeamProgress.roleSegments.find(
                    s => s.role === resolvedTeamProgress.activeRole && s.status === 'active'
                  );
                  if (activeSeg && activeSeg.content) return null;
                  const cfg = ROLE_CONFIG[resolvedTeamProgress.activeRole!];
                  return cfg ? `${cfg.label}...` : 'Working...';
                })()}
              </span>
            </div>
          )}

          {/* Sprint complete summary */}
          {resolvedTeamProgress.sprintComplete && (
            <SprintSummaryCard roleSegments={resolvedTeamProgress.roleSegments} />
          )}
        </div>
      )}

      {/* Sprint team: show "analyzing" when no segments yet */}
      {isSprintTeam && isStreaming && (!resolvedTeamProgress || resolvedTeamProgress.roleSegments.length === 0) && (
        <div className="ml-10 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[11px] text-muted-foreground/60">Starting sprint...</span>
          </div>
        </div>
      )}

      {/* Legacy collapsible steps (non-team mode) */}
      {showLegacySteps && (
        <div className="ml-10 mb-3">
          <button
            onClick={() => setStepsExpanded(!stepsExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {!isStreaming ? (
              <Check className="h-4 w-4 text-muted-foreground" />
            ) : (
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
              </div>
            )}
            <span className="font-medium">
              {!isStreaming
                ? `Processed ${getStepCount(streamPhase, message, isPlannerAgent)} steps`
                : `Processing${streamPhase === 'writing' ? ` (${streamingLineCount} lines)` : '...'}`}
            </span>
            {stepsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>

          {stepsExpanded && (
            <div className="mt-2 space-y-1.5">
              <ThinkingSteps
                streamPhase={streamPhase}
                isStreaming={!!isStreaming}
                agentName={effectiveAgentName}
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
            buildDisabled={!!isGenerating}
          />
        </div>
      ) : isSprintTeam ? (
        <>
          {!isStreaming && message.content && (
            <div className="ml-10 mt-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
              <div className="text-[13px] leading-relaxed text-foreground/80">
                {message.content.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-2" />;
                  if (line.startsWith('  • ')) {
                    return (
                      <div key={i} className="flex items-start gap-2 pl-2 py-0.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500/60" />
                        <span className="text-foreground/70">{line.replace('  • ', '')}</span>
                      </div>
                    );
                  }
                  if (line === 'Features included:') {
                    return <p key={i} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-1 mb-0.5">{line}</p>;
                  }
                  if (i === 0) {
                    return <p key={i} className="font-medium text-foreground">{line}</p>;
                  }
                  if (line.startsWith('You can continue')) {
                    return <p key={i} className="text-[12px] text-muted-foreground/60 mt-1">{line}</p>;
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          )}
        </>
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
      {!isStreaming && message.content && !isSprintTeam && (
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

// --- Rebuild team progress from persisted sprintRaw ---

function rebuildTeamProgress(sprintRaw: string): TeamProgress {
  const markerRegex = /\[TEAM:(\w+):(\w+):([^:]+):([^\]]+)\]/g;
  const phases: TeamPhaseInfo[] = [];
  let m;
  while ((m = markerRegex.exec(sprintRaw)) !== null) {
    phases.push({
      role: m[1] as TeamPhaseInfo['role'],
      status: m[2] as TeamPhaseInfo['status'],
      name: m[3],
      title: m[4],
    });
  }

  const roleSegments = parseRoleSegments(sprintRaw);
  const sprintComplete = sprintRaw.includes('[SPRINT:COMPLETE]');

  let baQuestions: BAQuestion[] | null = null;
  const qMatch = sprintRaw.match(/\[QUESTIONS\]([\s\S]*?)\[\/QUESTIONS\]/);
  if (qMatch) {
    const lines = qMatch[1].trim().split('\n').filter(Boolean);
    baQuestions = lines.map(line => {
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();
      const optionRegex = /\[([A-Z])\]\s*([^[]*?)(?=\s*\[[A-Z]\]|$)/g;
      const options: { key: string; label: string }[] = [];
      let optMatch;
      while ((optMatch = optionRegex.exec(cleaned)) !== null) {
        options.push({ key: optMatch[1], label: optMatch[2].trim() });
      }
      const questionText = cleaned.replace(/\s*\[[A-Z]\]\s*[^[]*?(?=\s*\[[A-Z]\]|$)/g, '').trim();
      return { text: questionText, options };
    }).filter(q => q.text);
  }

  let baRejection: string | null = null;
  const rMatch = sprintRaw.match(/\[BA:REJECT\]([\s\S]*?)(?:\[\/BA:REJECT\]|$)/);
  if (rMatch) {
    baRejection = rMatch[1].trim();
  }

  return {
    phases,
    activeRole: null,
    baQuestions,
    baRejection,
    sprintComplete,
    roleSegments,
  };
}

// --- Collapsible Role Card ---

interface RoleCardProps {
  segment: RoleSegment;
  isActive: boolean;
}

function RoleCard({ segment, isActive }: RoleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = ROLE_CONFIG[segment.role];
  if (!config) return null;

  const Icon = config.icon;
  const isDone = segment.status === 'done';
  const isFail = segment.status === 'fail';
  const showExpanded = isActive || expanded;

  const contentPreview = segment.content
    ? segment.content.split('\n').filter(l => l.trim()).slice(0, 2).join(' ').slice(0, 80)
    : '';

  return (
    <div className={cn(
      'rounded-lg border transition-all duration-200',
      isActive
        ? 'border-violet-500/20 bg-violet-500/[0.02]'
        : isDone
          ? 'border-border/50 bg-transparent'
          : isFail
            ? 'border-red-500/20 bg-red-500/[0.02]'
            : 'border-border/30'
    )}>
      <button
        onClick={() => !isActive && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
          !isActive && 'hover:bg-muted/30 rounded-lg'
        )}
      >
        {/* Status indicator */}
        <div className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          isActive && `bg-gradient-to-br ${config.gradient}`,
          isDone && 'bg-muted/60',
          isFail && 'bg-red-500/10',
          !isActive && !isDone && !isFail && 'bg-muted/30'
        )}>
          {isDone ? (
            <Check className="h-3 w-3 text-muted-foreground/50" />
          ) : isFail ? (
            <span className="text-[8px] font-bold text-red-500">!</span>
          ) : isActive ? (
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          ) : (
            <Icon className="h-3 w-3 text-muted-foreground/30" />
          )}
        </div>

        {/* Role name + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-[12px] font-semibold',
              isActive ? config.color : 'text-muted-foreground/70'
            )}>
              {segment.name}
            </span>
            <span className="text-[10px] text-muted-foreground/40">{segment.title}</span>
            {isActive && (
              <span className="text-[9px] text-violet-500/70 font-medium ml-1">Working...</span>
            )}
          </div>
          {/* Preview when collapsed */}
          {!showExpanded && contentPreview && (
            <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
              {contentPreview}...
            </p>
          )}
        </div>

        {/* Expand toggle */}
        {!isActive && segment.content && (
          <div className="shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/30" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {showExpanded && segment.content && (
        <div className={cn(
          'px-3 pb-3 pt-0',
          isActive ? 'border-t border-violet-500/10 mt-0' : 'border-t border-border/30'
        )}>
          <div className="mt-2 text-[12px] leading-relaxed text-muted-foreground/70 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
            {segment.content}
            {isActive && <StreamingCursor />}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sprint Summary Card ---

interface SprintSummaryCardProps {
  roleSegments: RoleSegment[];
}

function SprintSummaryCard({ roleSegments }: SprintSummaryCardProps) {
  const qaPass = roleSegments.some(s => s.role === 'qa' && s.status === 'done');
  const completedRoles = roleSegments.filter(s => s.status === 'done').length;

  return (
    <div className="mt-2 rounded-xl border border-green-500/20 bg-green-500/[0.03] dark:bg-green-500/[0.05] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
          <Rocket className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">MVP Shipped</p>
          <p className="text-[11px] text-muted-foreground">
            {completedRoles} roles completed{qaPass ? ' — QA passed' : ''} — view in preview panel
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Question Card (BA asks the user with clickable options) ---

interface QuestionCardProps {
  questions: BAQuestion[];
  onAnswer?: (answer: string) => void;
  disabled: boolean;
}

function QuestionCard({ questions, onAnswer, disabled }: QuestionCardProps) {
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [freeText, setFreeText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectOption = (qIdx: number, key: string) => {
    if (submitted) return;
    setSelections(prev => ({ ...prev, [qIdx]: prev[qIdx] === key ? '' : key }));
  };

  const handleSubmit = () => {
    if (!onAnswer || submitted) return;
    const parts: string[] = [];
    questions.forEach((q, i) => {
      const sel = selections[i];
      if (sel) {
        const opt = q.options.find(o => o.key === sel);
        parts.push(`${q.text} → ${sel}: ${opt?.label || sel}`);
      }
    });
    if (freeText.trim()) parts.push(`Additional: ${freeText.trim()}`);
    if (parts.length === 0) return;
    setSubmitted(true);
    onAnswer(parts.join('\n'));
  };

  const hasAnySelection = Object.values(selections).some(v => v) || freeText.trim();

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/10 bg-amber-500/[0.04]">
        <MessageCircleQuestion className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Mike wants to confirm a few things</span>
      </div>

      <div className="px-4 py-3 space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx}>
            <div className="flex items-start gap-2 text-sm text-foreground/80 mb-2">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {qIdx + 1}
              </span>
              <span className="leading-relaxed font-medium">{q.text}</span>
            </div>
            {q.options.length > 0 && (
              <div className="ml-7 flex flex-wrap gap-1.5">
                {q.options.map((opt) => {
                  const isSelected = selections[qIdx] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => selectOption(qIdx, opt.key)}
                      disabled={disabled || submitted}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all border',
                        submitted && !isSelected
                          ? 'opacity-40 cursor-default border-transparent bg-muted/30 text-muted-foreground'
                          : isSelected
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10'
                            : 'border-border/50 bg-background hover:border-amber-500/30 hover:bg-amber-500/5 text-foreground/70',
                        (disabled || submitted) && 'cursor-default',
                      )}
                    >
                      <span className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold',
                        isSelected
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted/60 text-muted-foreground/60',
                      )}>
                        {opt.key}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-amber-500/10 bg-amber-500/[0.02]">
        {!submitted ? (
          <div className="space-y-2">
            <input
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && hasAnySelection && handleSubmit()}
              placeholder="Anything else to add? (optional)"
              disabled={disabled}
              className="w-full rounded-lg border border-amber-500/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-muted-foreground/40 disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || !hasAnySelection}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-all',
                !hasAnySelection || disabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
              )}
            >
              <Send className="h-3.5 w-3.5" />
              Confirm & Continue
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Check className="h-4 w-4" />
            <span className="font-medium">Preferences confirmed — sprint continuing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Rejection Card (BA deems request too vague) ---

function RejectionCard({ content }: { content: string }) {
  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] dark:bg-orange-500/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-orange-500/10 bg-orange-500/[0.04]">
        <AlertTriangle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Mike needs more details</span>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {lines.map((line, i) => {
          const boldMatch = line.match(/^\s*[-*]\s+\*\*(.+?)\*\*\s*(.*)/);
          if (boldMatch) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500/60" />
                <span className="text-foreground/80">
                  <strong className="text-foreground">{boldMatch[1]}</strong>
                  {boldMatch[2] && ` ${boldMatch[2]}`}
                </span>
              </div>
            );
          }
          const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
          if (bulletMatch) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500/60" />
                <span className="text-foreground/70">{bulletMatch[1]}</span>
              </div>
            );
          }
          if (line.toLowerCase().startsWith('example:') || line.toLowerCase().startsWith('例如:') || line.toLowerCase().startsWith('例如：')) {
            return (
              <div key={i} className="mt-2 rounded-lg bg-orange-500/[0.05] border border-orange-500/10 px-3 py-2">
                <p className="text-[11px] text-orange-600/70 dark:text-orange-400/70 font-medium mb-0.5">Example</p>
                <p className="text-sm text-foreground/70 italic">{line.replace(/^(?:example|例如)[：:]\s*/i, '')}</p>
              </div>
            );
          }
          return <p key={i} className="text-sm text-foreground/70 leading-relaxed">{line}</p>;
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-orange-500/10 bg-orange-500/[0.02]">
        <p className="text-[11px] text-muted-foreground/50">Please re-enter a more specific request in the chat below.</p>
      </div>
    </div>
  );
}

// --- Plan parsing utilities ---

interface PlanSection {
  title: string;
  items: PlanItem[];
  isOverview?: boolean;
  isComplexity?: boolean;
}

interface PlanItem {
  id: string;
  text: string;
  type: 'bullet' | 'numbered' | 'text';
}

function parsePlanSections(content: string): PlanSection[] {
  const lines = content.split('\n');
  const sections: PlanSection[] = [];
  let current: PlanSection | null = null;
  let itemIdx = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      const title = headingMatch[1].trim();
      const isOverview = /overview/i.test(title);
      const isComplexity = /complexity/i.test(title);
      current = { title, items: [], isOverview, isComplexity };
      continue;
    }

    if (!current) {
      current = { title: '', items: [] };
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);

    if (bulletMatch) {
      current.items.push({ id: `item-${itemIdx++}`, text: bulletMatch[1], type: 'bullet' });
    } else if (numberedMatch) {
      current.items.push({ id: `item-${itemIdx++}`, text: numberedMatch[1], type: 'numbered' });
    } else {
      current.items.push({ id: `item-${itemIdx++}`, text: trimmed, type: 'text' });
    }
  }
  if (current) sections.push(current);
  return sections;
}

function reconstructPlanFromSelections(
  sections: PlanSection[],
  selectedIds: Set<string>,
  allSelected: boolean,
): string {
  const parts: string[] = [];
  for (const section of sections) {
    if (section.isOverview || section.isComplexity) {
      parts.push(`## ${section.title}`);
      section.items.forEach(item => parts.push(item.text));
      parts.push('');
      continue;
    }
    const kept = allSelected
      ? section.items
      : section.items.filter(item => item.type === 'text' || selectedIds.has(item.id));
    if (kept.length === 0) continue;
    parts.push(`## ${section.title}`);
    let num = 1;
    for (const item of kept) {
      if (item.type === 'numbered') parts.push(`${num++}. ${item.text}`);
      else if (item.type === 'bullet') parts.push(`- ${item.text}`);
      else parts.push(item.text);
    }
    parts.push('');
  }
  return parts.join('\n').trim();
}

// --- Plan Card ---

interface PlanCardProps {
  content: string;
  isStreaming: boolean;
  onImplement: (filteredPlan: string) => void;
  showImplement: boolean;
  buildDisabled?: boolean;
}

function PlanCard({ content, isStreaming, onImplement, showImplement, buildDisabled }: PlanCardProps) {
  const sections = useMemo(() => parsePlanSections(content), [content]);
  const selectableItems = useMemo(
    () => sections.flatMap(s => (s.isOverview || s.isComplexity) ? [] : s.items.filter(i => i.type !== 'text')),
    [sections],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [implemented, setImplemented] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(selectableItems.map(i => i.id)));
  const isDisabled = implemented || !!buildDisabled;

  const allSelected = selectedIds.size === selectableItems.length;
  const noneSelected = selectedIds.size === 0;

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableItems.map(i => i.id)));
  };

  const handleBuild = () => {
    setImplemented(true);
    const effectiveAll = noneSelected || allSelected;
    const filtered = reconstructPlanFromSelections(sections, selectedIds, effectiveAll);
    onImplement(filtered);
  };

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.06] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => !isStreaming && setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-2.5 border-b border-blue-500/10 bg-blue-500/[0.03] text-left hover:bg-blue-500/[0.05] transition-colors"
      >
        <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Plan</span>
        {!isStreaming && selectableItems.length > 0 && (
          <span className="text-[10px] text-muted-foreground/40 ml-1">
            {selectedIds.size}/{selectableItems.length} selected
          </span>
        )}
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] text-blue-500/70">Planning...</span>
          </div>
        )}
        {!isStreaming && (
          <div className="ml-auto">
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </div>
        )}
      </button>

      {/* Content - interactive selectable sections */}
      {!collapsed && (
        <div className="max-h-[400px] overflow-y-auto">
          {/* Select all toggle */}
          {!isStreaming && selectableItems.length > 0 && !implemented && (
            <div className="px-4 pt-2.5 pb-1 border-b border-blue-500/5">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <div className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border transition-all',
                  allSelected
                    ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                    : 'border-muted-foreground/30 bg-transparent',
                )}>
                  {allSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          )}

          {sections.map((section, sIdx) => (
            <div key={sIdx} className="px-4 py-2 first:pt-2.5 last:pb-2.5">
              {section.title && (
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isSelectable = item.type !== 'text' && !section.isOverview && !section.isComplexity;
                  const isSelected = selectedIds.has(item.id);

                  if (section.isOverview || section.isComplexity || item.type === 'text') {
                    return (
                      <p key={item.id} className="text-sm leading-relaxed text-foreground/70">
                        {item.text}
                      </p>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => !implemented && toggleItem(item.id)}
                      disabled={implemented}
                      className={cn(
                        'flex items-start gap-2.5 w-full text-left rounded-lg px-2.5 py-1.5 transition-all group',
                        implemented
                          ? 'cursor-default'
                          : isSelected
                            ? 'bg-blue-500/[0.06] hover:bg-blue-500/10'
                            : 'hover:bg-muted/40 opacity-60 hover:opacity-80',
                      )}
                    >
                      <div className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                        isSelected
                          ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500 shadow-sm shadow-blue-500/20'
                          : 'border-muted-foreground/25 bg-transparent group-hover:border-muted-foreground/40',
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn(
                        'text-[13px] leading-relaxed',
                        isSelected ? 'text-foreground/80' : 'text-muted-foreground',
                      )}>
                        {item.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="px-4 pb-3">
              <StreamingCursor />
            </div>
          )}
        </div>
      )}

      {/* Build button with selection summary */}
      {showImplement && (
        <div className="px-4 py-3 border-t border-blue-500/10 bg-gradient-to-r from-blue-500/[0.03] to-violet-500/[0.03]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBuild}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all',
                isDisabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]',
              )}
            >
              <Rocket className="h-4 w-4" />
              {isDisabled
                ? 'Building...'
                : noneSelected
                  ? 'Build all'
                  : allSelected
                    ? 'Build all'
                    : `Build ${selectedIds.size} selected`}
            </button>
            {!isDisabled && !allSelected && !noneSelected && (
              <span className="text-[11px] text-muted-foreground/50">
                {selectableItems.length - selectedIds.size} items excluded
              </span>
            )}
          </div>
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
    { id: 'analyze', text: 'Analyzing request...', done: phaseIdx > 0, active: phase === 'analyzing' },
    { id: 'route', text: `Routing to ${agentName || 'agent'}.`, done: phaseIdx > 1, active: phase === 'routing' },
    {
      id: 'write',
      text: phase === 'writing' ? `Writing code${lineCount > 0 ? ` — ${lineCount} lines` : '...'}` : 'Code complete.',
      done: phaseIdx > 2, active: phase === 'writing',
    },
    { id: 'validate', text: phase === 'validating' ? 'Reviewing...' : 'Verified.', done: phase === 'complete' || phase === 'fixing', active: phase === 'validating' },
    ...(phase === 'fixing' || (phase === 'complete' && phaseIdx >= 4)
      ? [{ id: 'fix', text: phase === 'fixing' ? 'Fixing...' : 'Resolved.', done: phase === 'complete', active: phase === 'fixing' }]
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
            <span className="text-[13px] leading-relaxed text-muted-foreground">{step.text}</span>
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
