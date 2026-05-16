'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCw, ExternalLink, Code, Eye, MonitorSmartphone } from 'lucide-react';

type ViewMode = 'preview' | 'code';

interface PreviewPanelProps {
  html?: string | null;
  isGenerating?: boolean;
}

export function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [iframeKey, setIframeKey] = useState(0);

  const handleReload = () => {
    setIframeKey((k) => k + 1);
  };

  const handleOpenNewTab = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-3 py-2">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="gap-1.5 text-xs px-3 h-7">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1.5 text-xs px-3 h-7">
              <Code className="h-3.5 w-3.5" />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              onClick={handleReload}
              disabled={!html}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Reload preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              onClick={handleOpenNewTab}
              disabled={!html}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <PreviewView
            html={html}
            isGenerating={isGenerating}
            iframeKey={iframeKey}
          />
        ) : (
          <CodeView html={html} />
        )}
      </div>
    </div>
  );
}

function PreviewView({
  html,
  isGenerating,
  iframeKey,
}: {
  html?: string | null;
  isGenerating?: boolean;
  iframeKey: number;
}) {
  if (isGenerating) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Generating your app...</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <div className="text-center space-y-4">
          <MonitorSmartphone className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              Your app will appear here
            </p>
            <p className="text-sm text-muted-foreground/70">
              Describe what you want to build in the chat panel
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={iframeKey}
      srcDoc={html}
      sandbox="allow-scripts allow-forms allow-modals allow-popups"
      className="h-full w-full border-0 bg-white"
      title="App Preview"
    />
  );
}

function CodeView({ html }: { html?: string | null }) {
  if (!html) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No code generated yet.
      </div>
    );
  }

  return (
    <pre className="h-full overflow-auto bg-zinc-950 p-4 text-xs text-zinc-300 font-mono leading-relaxed">
      <code>{html}</code>
    </pre>
  );
}
