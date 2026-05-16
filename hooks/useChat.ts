'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ParseResult, Project } from '@/types';
import { parseHtmlFence } from '@/lib/parser';
import { getStorage } from '@/lib/storage';
import { useToast } from '@/components/Toast';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentHtml: string | null;
  streamingContent: string;
  lastParseResult: ParseResult | null;
  activeProjectId: string | null;
  refreshTrigger: number;
  sendMessage: (content: string) => void;
  stopGeneration: () => void;
  loadProject: (id: string) => Promise<void>;
  newChat: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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

      // Create project if this is the first message
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
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setStreamingContent(fullContent);

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
            }
            return updated;
          });
        }

        // Parse and update HTML
        const result = parseHtmlFence(fullContent);
        setLastParseResult(result);

        let newHtml = currentHtml;
        if (result.status === 'complete') {
          newHtml = result.html;
          setCurrentHtml(newHtml);
        }

        // Auto-save with version snapshot
        const finalMessages: ChatMessage[] = [...updatedMessages, {
          ...assistantMessage,
          content: fullContent,
        }];
        setMessages(finalMessages);

        const storage = getStorage();
        const existing = await storage.getProject(projectId);
        const versions = existing?.versions || [];

        if (result.status === 'complete' && newHtml) {
          versions.push({ html: newHtml, timestamp: Date.now() });
        }

        await saveProject(projectId, finalMessages, newHtml, versions);
      } catch (error) {
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
          showToast(errorMsg, 'error', {
            label: 'Retry',
            onClick: () => sendMessage(content),
          });
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
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentHtml(null);
    setActiveProjectId(null);
    projectIdRef.current = null;
    setStreamingContent('');
    setLastParseResult(null);
  }, []);

  return {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    lastParseResult,
    activeProjectId,
    refreshTrigger,
    sendMessage,
    stopGeneration,
    loadProject,
    newChat,
  };
}
