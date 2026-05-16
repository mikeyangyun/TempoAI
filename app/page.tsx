'use client';

import { ResizablePanel } from '@/components/ResizablePanel';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      {/* Top bar — minimal, just theme toggle */}
      <header className="flex items-center justify-end border-b px-4 py-2">
        <ThemeToggle />
      </header>

      {/* Main content — resizable split pane */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanel
          left={<ChatPanel />}
          right={<PreviewPanel />}
          defaultLeftWidth={38}
          minLeftWidth={25}
          maxLeftWidth={55}
        />
      </main>
    </div>
  );
}
