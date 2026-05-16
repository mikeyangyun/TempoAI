'use client';

import { ResizablePanel } from '@/components/ResizablePanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const {
    messages,
    isGenerating,
    currentHtml,
    streamingContent,
    activeProjectId,
    refreshTrigger,
    sendMessage,
    stopGeneration,
    loadProject,
    newChat,
  } = useChat();

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">
          Tempo AI
        </span>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeProjectId={activeProjectId}
          onSelectProject={loadProject}
          onNewChat={newChat}
          refreshTrigger={refreshTrigger}
        />

        {/* Split pane */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanel
            left={
              <ChatPanel
                messages={messages}
                isGenerating={isGenerating}
                onSend={sendMessage}
                onStop={stopGeneration}
              />
            }
            right={
              <PreviewPanel
                html={currentHtml}
                isGenerating={isGenerating}
                streamingContent={streamingContent}
              />
            }
            defaultLeftWidth={42}
            minLeftWidth={30}
            maxLeftWidth={55}
          />
        </div>
      </div>
    </div>
  );
}
