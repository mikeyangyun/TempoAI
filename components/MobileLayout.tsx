'use client';

import { useState } from 'react';
import { MessageSquare, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  chatPanel: React.ReactNode;
  previewPanel: React.ReactNode;
  hasPreview: boolean;
}

export function MobileLayout({ chatPanel, previewPanel, hasPreview }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        <div className={cn('absolute inset-0', activeTab !== 'chat' && 'hidden')}>
          {chatPanel}
        </div>
        <div className={cn('absolute inset-0', activeTab !== 'preview' && 'hidden')}>
          {previewPanel}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="flex border-t bg-background">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            activeTab === 'chat'
              ? 'text-primary border-t-2 border-primary -mt-px'
              : 'text-muted-foreground'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'relative flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            activeTab === 'preview'
              ? 'text-primary border-t-2 border-primary -mt-px'
              : 'text-muted-foreground'
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
          {hasPreview && activeTab !== 'preview' && (
            <span className="absolute top-2 right-[calc(50%-28px)] h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
