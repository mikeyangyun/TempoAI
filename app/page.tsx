'use client';

import { useCallback, useRef } from 'react';
import { ResizablePanel } from '@/components/ResizablePanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { MobileLayout } from '@/components/MobileLayout';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChat } from '@/hooks/useChat';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Home() {
  const {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    activeProjectId,
    refreshTrigger,
    versions,
    currentVersionIndex,
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

  const chatPanel = (
    <ChatPanel
      messages={messages}
      isGenerating={isGenerating}
      onSend={sendMessage}
      onStop={stopGeneration}
      inputRef={chatInputRef}
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
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">
          Tempo AI
        </span>
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ⌘K <span className="text-muted-foreground/60">new</span>
          </kbd>
          <ThemeToggle />
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
