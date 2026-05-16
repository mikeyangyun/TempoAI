'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  MessageSquare,
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
      const storage = getStorage();
      await storage.deleteProject(id);
      const list = await storage.listProjects();
      setProjects(list);
      if (activeProjectId === id) {
        onNewChat();
      }
    },
    [activeProjectId, onNewChat]
  );

  if (!isOpen) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r bg-background py-2">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-60 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onNewChat}
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Button>
        <button
          onClick={() => setIsOpen(false)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <Separator />

      {/* Project list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {projects.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No projects yet
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-sm hover:bg-accent transition-colors',
                  activeProjectId === project.id && 'bg-accent'
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-xs">
                  {project.title}
                </span>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:inline-flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-3 py-2">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
