'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { ResizablePanel } from '@/components/ResizablePanel';
import { TempoLogo } from '@/components/TempoLogo';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { MobileLayout } from '@/components/MobileLayout';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { HomePage } from '@/components/HomePage';
import { useChat } from '@/hooks/useChat';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const MODEL_BADGE = process.env.NEXT_PUBLIC_LLM_LABEL || 'AI';

export default function Home() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    activeProjectId,
    refreshTrigger,
    versions,
    currentVersionIndex,
    streamPhase,
    agentName,
    fileMap,
    sendMessage,
    stopGeneration,
    loadProject,
    newChat,
    restoreVersion,
  } = useChat();

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tempo_pending_prompt');
    }
    return null;
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isHomePage = messages.length === 0 && !isGenerating && !activeProjectId;

  const focusInput = useCallback(() => {
    chatInputRef.current?.focus();
  }, []);

  useKeyboardShortcuts({
    onNewChat: newChat,
    onStopGeneration: stopGeneration,
    onFocusInput: focusInput,
    isGenerating,
  });

  const handleSend = useCallback(
    (content: string) => {
      if (!isSignedIn) {
        setPendingPrompt(content);
        sessionStorage.setItem('tempo_pending_prompt', content);
        openSignIn();
        return;
      }
      setPendingPrompt(null);
      sessionStorage.removeItem('tempo_pending_prompt');
      sendMessage(content);
    },
    [isSignedIn, openSignIn, sendMessage]
  );

  // Auto-send pending prompt after login completes
  useEffect(() => {
    if (isSignedIn && pendingPrompt) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      sessionStorage.removeItem('tempo_pending_prompt');
      sendMessage(prompt);
    }
  }, [isSignedIn, pendingPrompt, sendMessage]);

  const projectTitle = messages.find((m) => m.role === 'user')?.content.slice(0, 50);

  const streamingLineCount = streamingContent
    ? streamingContent.split('\n').length
    : 0;

  const chatPanel = (
    <ChatPanel
      messages={messages}
      isGenerating={isGenerating}
      onSend={handleSend}
      onStop={stopGeneration}
      inputRef={chatInputRef}
      streamPhase={streamPhase}
      agentName={agentName}
      streamingLineCount={streamingLineCount}
    />
  );

  const previewPanel = (
    <PreviewPanel
      html={currentHtml}
      isGenerating={isGenerating}
      streamingContent={streamingContent}
      versions={versions}
      currentVersionIndex={currentVersionIndex}
      onRestoreVersion={restoreVersion}
      fileMap={fileMap}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="relative flex h-12 items-center justify-between bg-background/80 backdrop-blur-sm px-4">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={newChat}
            className="flex items-center gap-2.5 shrink-0 group transition-all"
          >
            <TempoLogo size="sm" className="group-hover:shadow-lg group-hover:shadow-violet-500/30 transition-all duration-300" />
            <span className="text-sm font-bold hidden sm:inline tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-violet-600 group-hover:to-blue-600 dark:group-hover:from-violet-400 dark:group-hover:to-blue-400 transition-all duration-300">Tempo AI</span>
          </button>

          {projectTitle && (
            <>
              <div className="h-4 w-px bg-border shrink-0" />
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {projectTitle}
              </span>
            </>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {!isHomePage && (
            <span className="hidden md:inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {MODEL_BADGE}
            </span>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      {isHomePage ? (
        <HomePage onSend={handleSend} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {!isMobile && (
            <Sidebar
              activeProjectId={activeProjectId}
              onSelectProject={loadProject}
              onNewChat={newChat}
              refreshTrigger={refreshTrigger}
            />
          )}

          <div className="flex-1 overflow-hidden">
            {isMobile ? (
              <MobileLayout
                chatPanel={chatPanel}
                previewPanel={previewPanel}
                hasPreview={!!currentHtml}
              />
            ) : (
              <ResizablePanel
                left={chatPanel}
                right={previewPanel}
                defaultLeftWidth={42}
                minLeftWidth={30}
                maxLeftWidth={55}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
