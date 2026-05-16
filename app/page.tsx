'use client';

import { ResizablePanel } from '@/components/ResizablePanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const {
    messages,
    isGenerating,
    currentHtml,
    sendMessage,
    stopGeneration,
  } = useChat();

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-end border-b px-4 py-2">
        <ThemeToggle />
      </header>

      {/* Main content — resizable split pane */}
      <main className="flex-1 overflow-hidden">
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
            />
          }
          defaultLeftWidth={38}
          minLeftWidth={25}
          maxLeftWidth={55}
        />
      </main>
    </div>
  );
}
