'use client';

import { useCallback, useRef } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';
import { ResizablePanel } from '@/components/ResizablePanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { MobileLayout } from '@/components/MobileLayout';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
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
    sendMessage,
    stopGeneration,
    loadProject,
    newChat,
    restoreVersion,
  } = useChat();

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
        openSignIn();
        return;
      }
      sendMessage(content);
    },
    [isSignedIn, openSignIn, sendMessage]
  );

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
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.02)]">
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold hidden sm:inline">Tempo AI</span>
          </div>

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
          <span className="hidden md:inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {MODEL_BADGE}
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ⌘K
          </kbd>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
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
    </div>
  );
}
