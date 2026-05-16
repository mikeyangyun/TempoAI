'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ParseResult, Project, ProjectVersion } from '@/types';
import { parseHtmlFence } from '@/lib/parser';
import { getStorage } from '@/lib/storage';
import { useToast } from '@/components/Toast';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type StreamPhase = 'idle' | 'analyzing' | 'routing' | 'writing' | 'complete';

function splitStreamContent(fullText: string): { chatText: string; codeText: string } {
  const fenceOpenRegex = /```html\s*\n?/;
  const fenceCloseRegex = /\n?```/;

  const openMatch = fullText.match(fenceOpenRegex);

  if (!openMatch || openMatch.index === undefined) {
    return { chatText: fullText, codeText: '' };
  }

  const beforeFence = fullText.slice(0, openMatch.index);
  const afterOpenIndex = openMatch.index + openMatch[0].length;
  const contentAfterOpen = fullText.slice(afterOpenIndex);

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
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  loadProject: (id: string) => Promise<void>;
  newChat: () => void;
  restoreVersion: (index: number) => void;
}

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const projectIdRef = useRef<string | null>(null);
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
    async (content: string) => {
      if (!content.trim() || isGenerating) return;

      let projectId = projectIdRef.current;
      if (!projectId) {
        projectId = generateId();
        projectIdRef.current = projectId;
        setActiveProjectId(projectId);
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

          const { chatText, codeText } = splitStreamContent(fullContent);

          // Transition to writing phase when code starts flowing
          if (codeText && !phaseSetToWriting) {
            setStreamPhase('writing');
            phaseSetToWriting = true;
          }

          setStreamingContent(codeText);

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

        const result = parseHtmlFence(fullContent);
        setLastParseResult(result);

        let newHtml = currentHtml;
        if (result.status === 'complete') {
          newHtml = result.html;
          setCurrentHtml(newHtml);
        }

        const { chatText: finalChatText } = splitStreamContent(fullContent);
        const finalMessages: ChatMessage[] = [...updatedMessages, {
          ...assistantMessage,
          content: finalChatText,
          rawContent: fullContent,
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
    sendMessage,
    stopGeneration,
    loadProject,
    newChat,
    restoreVersion,
  };
}
