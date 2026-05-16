import { Project, ProjectMeta } from '@/types';

export interface StorageAdapter {
  listProjects(): Promise<ProjectMeta[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
}
