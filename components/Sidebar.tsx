'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  MessageSquare,
  Search,
} from 'lucide-react';
import { ProjectMeta } from '@/types';
import { getStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export function Sidebar({
  activeProjectId,
  onSelectProject,
  onNewChat,
  refreshTrigger,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const storage = getStorage();
      const list = await storage.listProjects();
      if (!cancelled) setProjects(list);
    }
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (deleteConfirm !== id) {
        setDeleteConfirm(id);
        setTimeout(() => setDeleteConfirm(null), 3000);
        return;
      }
      const storage = getStorage();
      await storage.deleteProject(id);
      const list = await storage.listProjects();
      setProjects(list);
      setDeleteConfirm(null);
      if (activeProjectId === id) {
        onNewChat();
      }
    },
    [activeProjectId, onNewChat, deleteConfirm]
  );

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r bg-muted/30 py-3 gap-2 transition-all duration-200">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNewChat}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1.5 text-xs shadow-sm"
          onClick={onNewChat}
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Button>
        <button
          onClick={() => setIsOpen(false)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Recent
        </span>
      </div>

      {/* Project list */}
      <ScrollArea className="flex-1">
        <div className="px-2 space-y-0.5">
          {filteredProjects.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              {searchQuery ? 'No matches' : 'No projects yet'}
            </p>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors',
                  activeProjectId === project.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-medium truncate">
                    {project.title}
                  </span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(project.updatedAt)}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className={cn(
                    'shrink-0 h-6 w-6 items-center justify-center rounded transition-colors',
                    deleteConfirm === project.id
                      ? 'inline-flex bg-destructive/10 text-destructive'
                      : 'hidden group-hover:inline-flex text-muted-foreground hover:text-destructive'
                  )}
                  title={deleteConfirm === project.id ? 'Click again to confirm' : 'Delete'}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-3 py-2.5">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          {projects.length} project{projects.length !== 1 ? 's' : ''} · Tempo AI
        </p>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
