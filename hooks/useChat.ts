'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ParseResult, Project, ProjectVersion, FileMap, ChatMode, TeamRole, SprintContext } from '@/types';
import { parseHtmlFence, parseMultiFileFence, isMultiFileFormat, mergeFilesToHtml } from '@/lib/parser';
import { getStorage } from '@/lib/storage';
import { useToast } from '@/components/Toast';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type StreamPhase = 'idle' | 'analyzing' | 'routing' | 'writing' | 'validating' | 'fixing' | 'complete';

export type TeamPhaseInfo = {
  role: TeamRole;
  status: 'start' | 'done' | 'question' | 'pass' | 'fail' | 'fix';
  name: string;
  title: string;
};

export type TeamProgress = {
  phases: TeamPhaseInfo[];
  activeRole: TeamRole | null;
  baQuestions: string[] | null;
  sprintComplete: boolean;
};

/**
 * Splits streaming content into chat text and code text.
 * Supports both multi-file (```lang:filename) and legacy (```html) formats.
 */
function splitStreamContent(fullText: string): { chatText: string; codeText: string } {
  // Multi-file format: extract all code blocks
  const multiFileRegex = /```\w+:[^\n]+\n[\s\S]*?```/g;
  const singleFileRegex = /```html\s*\n?[\s\S]*?(?:```|$)/;

  if (isMultiFileFormat(fullText)) {
    const codeBlocks = fullText.match(multiFileRegex) || [];
    let chatText = fullText;
    for (const block of codeBlocks) {
      chatText = chatText.replace(block, '');
    }
    // Also remove unclosed blocks (still streaming)
    const unclosedRegex = /```\w+:[^\n]+\n[\s\S]*$/;
    const unclosedMatch = chatText.match(unclosedRegex);
    let codeText = '';
    if (unclosedMatch) {
      chatText = chatText.replace(unclosedMatch[0], '');
      codeText = unclosedMatch[0];
    }
    // Combine all code for the streaming display
    const allCode = [...codeBlocks, codeText].filter(Boolean).join('\n\n');
    return { chatText: chatText.trim(), codeText: allCode };
  }

  // Legacy single-file format
  const fenceOpenRegex = /```html\s*\n?/;
  const openMatch = fullText.match(fenceOpenRegex);

  if (!openMatch || openMatch.index === undefined) {
    return { chatText: fullText, codeText: '' };
  }

  const beforeFence = fullText.slice(0, openMatch.index);
  const afterOpenIndex = openMatch.index + openMatch[0].length;
  const contentAfterOpen = fullText.slice(afterOpenIndex);

  const fenceCloseRegex = /\n?```/;
  const closeMatch = contentAfterOpen.match(fenceCloseRegex);

  if (!closeMatch || closeMatch.index === undefined) {
    return { chatText: beforeFence.trim(), codeText: contentAfterOpen };
  }

  const code = contentAfterOpen.slice(0, closeMatch.index);
  const afterClose = contentAfterOpen.slice(closeMatch.index + closeMatch[0].length);
  const chatText = (beforeFence + afterClose).trim();

  return { chatText, codeText: code };
}

interface UseChatReturn {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentHtml: string | null;
  streamingContent: string;
  lastParseResult: ParseResult | null;
  activeProjectId: string | null;
  refreshTrigger: number;
  versions: ProjectVersion[];
  currentVersionIndex: number;
  streamPhase: StreamPhase;
  agentName: string;
  fileMap: FileMap;
  teamProgress: TeamProgress;
  sendMessage: (content: string, mode?: ChatMode) => void;
  answerBA: (answer: string) => void;
  stopGeneration: () => void;
  loadProject: (id: string) => Promise<void>;
  newChat: () => void;
  restoreVersion: (index: number) => void;
}

function parseTeamMarker(text: string): TeamPhaseInfo | null {
  const match = text.match(/\[TEAM:(\w+):(\w+):([^:]+):([^\]]+)\]/);
  if (!match) return null;
  return { role: match[1] as TeamRole, status: match[2] as TeamPhaseInfo['status'], name: match[3], title: match[4] };
}

function extractBAQuestions(text: string): string[] | null {
  const match = text.match(/\[QUESTIONS\]([\s\S]*?)\[\/QUESTIONS\]/);
  if (!match) return null;
  return match[1].trim().split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
}

const INITIAL_TEAM_PROGRESS: TeamProgress = {
  phases: [],
  activeRole: null,
  baQuestions: null,
  sprintComplete: false,
};

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>('idle');
  const [agentName, setAgentName] = useState('');
  const [fileMap, setFileMap] = useState<FileMap>({});
  const [teamProgress, setTeamProgress] = useState<TeamProgress>(INITIAL_TEAM_PROGRESS);
  const abortControllerRef = useRef<AbortController | null>(null);
  const projectIdRef = useRef<string | null>(null);
  const sprintContextRef = useRef<SprintContext | undefined>(undefined);
  const originalRequestRef = useRef<string>('');
  const { showToast } = useToast();

  const saveProject = useCallback(
    async (
      projectId: string,
      msgs: ChatMessage[],
      html: string | null,
      versions?: Project['versions']
    ) => {
      const storage = getStorage();
      const existing = await storage.getProject(projectId);

      const title =
        existing?.title ||
        msgs.find((m) => m.role === 'user')?.content.slice(0, 40) ||
        'Untitled';

      const project: Project = {
        id: projectId,
        title,
        messages: msgs,
        currentHtml: html,
        versions: versions || existing?.versions || [],
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveProject(project);
      setRefreshTrigger((n) => n + 1);
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, mode?: ChatMode, baAnswer?: string) => {
      if (!content.trim() || isGenerating) return;

      let projectId = projectIdRef.current;
      if (!projectId) {
        projectId = generateId();
        projectIdRef.current = projectId;
        setActiveProjectId(projectId);
      }

      if (!baAnswer) {
        originalRequestRef.current = content.trim();
      }

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
      setStreamPhase('analyzing');
      setAgentName('');
      if (!baAnswer) {
        setTeamProgress(INITIAL_TEAM_PROGRESS);
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      const messagesWithAssistant = [...updatedMessages, assistantMessage];
      setMessages(messagesWithAssistant);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            currentHtml,
            mode: mode || 'build',
            sprintContext: sprintContextRef.current,
            baAnswer,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Request failed with status ${response.status}`;
          const err = new Error(errorMessage);
          (err as Error & { status?: number }).status = response.status;
          throw err;
        }

        // Read agent name from response header
        const headerAgentName = response.headers.get('X-Agent-Name') || 'CodeGenerator';
        setAgentName(headerAgentName);
        setStreamPhase('routing');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';
        let phaseSetToWriting = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Detect TEAM phase markers (agile team)
          const teamMarkerRegex = /\[TEAM:(\w+):(\w+):([^:]+):([^\]]+)\]/g;
          let teamMatch;
          const currentPhases: TeamPhaseInfo[] = [];
          let latestActiveRole: TeamRole | null = null;
          let detectedQuestions: string[] | null = null;
          let sprintDone = false;

          while ((teamMatch = teamMarkerRegex.exec(fullContent)) !== null) {
            const info: TeamPhaseInfo = {
              role: teamMatch[1] as TeamRole,
              status: teamMatch[2] as TeamPhaseInfo['status'],
              name: teamMatch[3],
              title: teamMatch[4],
            };
            currentPhases.push(info);
            if (info.status === 'start' || info.status === 'fix') {
              latestActiveRole = info.role;
            }
            if (info.status === 'done' || info.status === 'pass' || info.status === 'fail') {
              if (latestActiveRole === info.role) latestActiveRole = null;
            }
            if (info.status === 'question') {
              detectedQuestions = extractBAQuestions(fullContent);
            }
          }

          if (fullContent.includes('[SPRINT:COMPLETE]')) {
            sprintDone = true;
          }

          setTeamProgress({
            phases: currentPhases,
            activeRole: latestActiveRole,
            baQuestions: detectedQuestions,
            sprintComplete: sprintDone,
          });

          // Legacy phase markers
          if (fullContent.includes('[PHASE:validating]')) {
            setStreamPhase('validating');
          }
          if (/\[PHASE:fixing:\d+\]/.test(fullContent)) {
            setStreamPhase('fixing');
          }
          if (fullContent.includes('[PHASE:validated]')) {
            setStreamPhase('writing');
          }

          // Strip all markers from content before parsing
          const cleanContent = fullContent
            .replace(/\n?\[TEAM:[^\]]*\]\n?/g, '')
            .replace(/\n?\[SPRINT:COMPLETE\]\n?/g, '')
            .replace(/\n?\[PHASE:\w+(?::\d+)?\]\n?/g, '')
            .replace(/\n?\[VALIDATION_FEEDBACK:[^\]]*\]\n?/g, '')
            .replace(/\[QUESTIONS\][\s\S]*?\[\/QUESTIONS\]/g, '');

          const { chatText, codeText } = splitStreamContent(cleanContent);

          if (codeText && !phaseSetToWriting) {
            setStreamPhase('writing');
            phaseSetToWriting = true;
          }

          setStreamingContent(codeText);

          if (isMultiFileFormat(cleanContent)) {
            const partialFiles = parseMultiFileFence(cleanContent);
            if (Object.keys(partialFiles).length > 0) {
              setFileMap(partialFiles);
            }
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = { ...updated[lastIdx], content: chatText };
            }
            return updated;
          });
        }

        // Stream complete
        setStreamPhase('complete');

        const cleanedFinal = fullContent
          .replace(/\n?\[TEAM:[^\]]*\]\n?/g, '')
          .replace(/\n?\[SPRINT:COMPLETE\]\n?/g, '')
          .replace(/\n?\[PHASE:\w+(?::\d+)?\]\n?/g, '')
          .replace(/\n?\[VALIDATION_FEEDBACK:[^\]]*\]\n?/g, '')
          .replace(/\[QUESTIONS\][\s\S]*?\[\/QUESTIONS\]/g, '');

        let newHtml = currentHtml;
        let result: ParseResult;

        if (isMultiFileFormat(cleanedFinal)) {
          const files = parseMultiFileFence(cleanedFinal);
          setFileMap(files);
          if (Object.keys(files).length > 0) {
            newHtml = mergeFilesToHtml(files);
            setCurrentHtml(newHtml);
            result = { status: 'complete', html: newHtml, raw: cleanedFinal };
          } else {
            result = { status: 'error', raw: cleanedFinal };
          }
        } else {
          result = parseHtmlFence(cleanedFinal);
          if (result.status === 'complete') {
            newHtml = result.html;
            setCurrentHtml(newHtml);
          }
          setFileMap({});
        }

        setLastParseResult(result);

        const { chatText: finalChatText } = splitStreamContent(cleanedFinal);
        const finalMessages: ChatMessage[] = [...updatedMessages, {
          ...assistantMessage,
          content: finalChatText,
          rawContent: cleanedFinal,
        }];
        setMessages(finalMessages);

        const storage = getStorage();
        const existing = await storage.getProject(projectId);
        const updatedVersions = existing?.versions || [];

        if (result.status === 'complete' && newHtml) {
          updatedVersions.push({ html: newHtml, timestamp: Date.now() });
        }

        setVersions(updatedVersions);
        setCurrentVersionIndex(updatedVersions.length - 1);
        await saveProject(projectId, finalMessages, newHtml, updatedVersions);
      } catch (error) {
        setStreamPhase('idle');
        if ((error as Error).name === 'AbortError') {
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
          showToast(errorMsg, 'error');
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: `⚠️ ${errorMsg}`,
              };
            }
            return updated;
          });
        }

        setMessages((prev) => {
          setTimeout(() => {
            if (projectId) {
              saveProject(projectId, prev, currentHtml);
            }
          }, 0);
          return prev;
        });
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isGenerating, currentHtml, saveProject, showToast]
  );

  const answerBA = useCallback(
    (answer: string) => {
      if (!answer.trim()) return;
      sendMessage(answer, 'build', answer);
    },
    [sendMessage]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const storage = getStorage();
    const project = await storage.getProject(id);
    if (!project) return;

    setMessages(project.messages);
    setCurrentHtml(project.currentHtml);
    setActiveProjectId(id);
    projectIdRef.current = id;
    setStreamingContent('');
    setLastParseResult(null);
    setVersions(project.versions || []);
    setCurrentVersionIndex(project.versions ? project.versions.length - 1 : -1);
    setStreamPhase('idle');
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentHtml(null);
    setActiveProjectId(null);
    projectIdRef.current = null;
    setStreamingContent('');
    setLastParseResult(null);
    setVersions([]);
    setCurrentVersionIndex(-1);
    setStreamPhase('idle');
    setAgentName('');
    setTeamProgress(INITIAL_TEAM_PROGRESS);
    sprintContextRef.current = undefined;
    originalRequestRef.current = '';
  }, []);

  const restoreVersion = useCallback(
    (index: number) => {
      if (index < 0 || index >= versions.length) return;
      const version = versions[index];
      setCurrentHtml(version.html);
      setCurrentVersionIndex(index);
      showToast(`Restored to version ${index + 1}`, 'success');
    },
    [versions, showToast]
  );

  return {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    lastParseResult,
    activeProjectId,
    refreshTrigger,
    versions,
    currentVersionIndex,
    streamPhase,
    agentName,
    fileMap,
    teamProgress,
    sendMessage,
    answerBA,
    stopGeneration,
    loadProject,
    newChat,
    restoreVersion,
  };
}
