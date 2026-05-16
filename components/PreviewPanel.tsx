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
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  Globe,
} from 'lucide-react';
import { IframePreviewEngine } from '@/lib/preview/iframe-engine';
import { VersionTimeline } from '@/components/VersionTimeline';
import { ProjectVersion } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'preview' | 'code';
type DeviceWidth = 'mobile' | 'tablet' | 'desktop';

const DEVICE_WIDTHS: Record<DeviceWidth, number | null> = {
  mobile: 375,
  tablet: 768,
  desktop: null,
};

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
  const [deviceWidth, setDeviceWidth] = useState<DeviceWidth>('desktop');
  const [prevHtml, setPrevHtml] = useState<string | null | undefined>(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<IframePreviewEngine>(new IframePreviewEngine());

  if (html && html !== prevHtml) {
    setPrevHtml(html);
    if (viewMode !== 'preview') {
      setViewMode('preview');
    }
  }

  useEffect(() => {
    if (iframeRef.current) {
      engineRef.current.bind(iframeRef.current);
    }
  }, []);

  useEffect(() => {
    if (html) {
      engineRef.current.inject(html);
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

  const handleCopyCode = useCallback(() => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const lineCount = streamingContent
    ? streamingContent.split('\n').length
    : 0;

  const iframeWidth = DEVICE_WIDTHS[deviceWidth];

  return (
    <div className="flex h-full flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-3 py-1.5">
        {/* Left: View tabs */}
        <div className="flex items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="preview" className="gap-1.5 text-[11px] px-2.5 h-6">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5 text-[11px] px-2.5 h-6">
                <Code className="h-3 w-3" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* URL bar */}
          {viewMode === 'preview' && html && (
            <div className="hidden md:flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-[10px] text-muted-foreground font-mono">
              <Globe className="h-3 w-3" />
              <span>preview://tempo-app</span>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-0.5">
          {/* Device width toggle */}
          {viewMode === 'preview' && (
            <div className="hidden sm:flex items-center gap-0.5 mr-1 border-r pr-1.5">
              {(['mobile', 'tablet', 'desktop'] as DeviceWidth[]).map((device) => (
                <button
                  key={device}
                  onClick={() => setDeviceWidth(device)}
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded transition-colors',
                    deviceWidth === device
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {device === 'mobile' && <Smartphone className="h-3 w-3" />}
                  {device === 'tablet' && <Tablet className="h-3 w-3" />}
                  {device === 'desktop' && <Monitor className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}

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
            <TooltipContent>Reload</TooltipContent>
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
        {/* Live iframe */}
        <div
          className={cn(
            'absolute inset-0 flex items-start justify-center overflow-auto transition-opacity duration-300',
            viewMode === 'preview' && html && !isGenerating
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-300',
              iframeWidth ? 'border-x shadow-sm' : 'w-full'
            )}
            style={iframeWidth ? { width: `${iframeWidth}px`, maxWidth: '100%' } : undefined}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="h-full w-full border-0 bg-white"
              title="App Preview"
            />
          </div>
        </div>

        {/* Streaming code preview */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col">
            <div className="flex items-center justify-between bg-card px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-medium text-foreground">
                  {streamingContent ? 'Writing code...' : 'Thinking...'}
                </span>
              </div>
              {lineCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lineCount} lines
                </span>
              )}
            </div>
            <ScrollArea className="flex-1 bg-card">
              {streamingContent ? (
                <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">
                  <code>{streamingContent}</code>
                  <span className="inline-block h-4 w-1.5 animate-pulse bg-primary ml-0.5" />
                </pre>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                    <span className="ml-2 text-xs">Analyzing your request...</span>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Code view */}
        {viewMode === 'code' && !isGenerating && (
          <div className="absolute inset-0 z-10">
            {html ? (
              <div className="relative h-full">
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <ScrollArea className="h-full bg-card">
                  <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">
                    <code>{addLineNumbers(html)}</code>
                  </pre>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm bg-background">
                No code generated yet.
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!html && !isGenerating && viewMode === 'preview' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-8 bg-background">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <MonitorSmartphone className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-medium text-foreground">
                  Your app will appear here
                </p>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to build in the chat
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function addLineNumbers(code: string): string {
  const lines = code.split('\n');
  const pad = String(lines.length).length;
  return lines
    .map((line, i) => `${String(i + 1).padStart(pad, ' ')} | ${line}`)
    .join('\n');
}
