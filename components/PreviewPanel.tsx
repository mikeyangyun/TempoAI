'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RotateCw,
  ExternalLink,
  Code,
  Eye,
  MonitorSmartphone,
  Download,
} from 'lucide-react';
import { IframePreviewEngine } from '@/lib/preview/iframe-engine';
import { VersionTimeline } from '@/components/VersionTimeline';
import { ProjectVersion } from '@/types';

type ViewMode = 'preview' | 'code';

interface PreviewPanelProps {
  html?: string | null;
  isGenerating?: boolean;
  streamingContent?: string;
  versions?: ProjectVersion[];
  currentVersionIndex?: number;
  onRestoreVersion?: (index: number) => void;
}

export function PreviewPanel({
  html,
  isGenerating,
  streamingContent,
  versions = [],
  currentVersionIndex = -1,
  onRestoreVersion,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<IframePreviewEngine>(new IframePreviewEngine());

  // Bind iframe to engine when mounted
  useEffect(() => {
    if (iframeRef.current) {
      engineRef.current.bind(iframeRef.current);
    }
  }, []);

  // Inject HTML when it changes
  useEffect(() => {
    if (html) {
      engineRef.current.inject(html);
      setViewMode('preview');
    }
  }, [html]);

  const handleReload = useCallback(() => {
    engineRef.current.reload();
  }, []);

  const handleOpenNewTab = useCallback(() => {
    engineRef.current.openInNewTab();
  }, []);

  const handleDownload = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tempo-app.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

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
          {versions.length > 0 && onRestoreVersion && (
            <VersionTimeline
              versions={versions}
              currentIndex={currentVersionIndex}
              onRestore={onRestoreVersion}
            />
          )}

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={handleReload}
              disabled={!html}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Reload preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={handleOpenNewTab}
              disabled={!html}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={handleDownload}
              disabled={!html}
            >
              <Download className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Download HTML</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Live iframe — always mounted, hidden when not in preview mode or no content */}
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className={`absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-200 ${
            viewMode === 'preview' && html && !isGenerating
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
          title="App Preview"
        />

        {/* Streaming code preview — shown during generation */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col">
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 border-b border-zinc-700">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs text-zinc-400">Generating...</span>
            </div>
            <ScrollArea className="flex-1 bg-zinc-950">
              <pre className="p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                <code>{streamingContent || 'Waiting for response...'}</code>
                <span className="inline-block h-4 w-1.5 animate-pulse bg-green-400 ml-0.5" />
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* Code view */}
        {viewMode === 'code' && !isGenerating && (
          <div className="absolute inset-0 z-10">
            {html ? (
              <ScrollArea className="h-full bg-zinc-950">
                <pre className="p-4 text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                  <code>{html}</code>
                </pre>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm bg-background">
                No code generated yet.
              </div>
            )}
          </div>
        )}

        {/* Empty state — shown when nothing is generated and not generating */}
        {!html && !isGenerating && viewMode === 'preview' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-8 bg-background">
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
        )}
      </div>
    </div>
  );
}
