import { Project, ProjectMeta } from '@/types';
import { StorageAdapter } from './types';

const PROJECTS_INDEX_KEY = 'tempo_projects_index';
const PROJECT_PREFIX = 'tempo_project_';

export class LocalStorageAdapter implements StorageAdapter {
  async listProjects(): Promise<ProjectMeta[]> {
    const raw = localStorage.getItem(PROJECTS_INDEX_KEY);
    if (!raw) return [];
    try {
      const metas: ProjectMeta[] = JSON.parse(raw);
      return metas.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Project;
    } catch {
      return null;
    }
  }

  async saveProject(project: Project): Promise<void> {
    // Save the full project
    localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project));

    // Update the index
    const metas = await this.listProjects();
    const existingIdx = metas.findIndex((m) => m.id === project.id);
    const meta: ProjectMeta = {
      id: project.id,
      title: project.title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    if (existingIdx >= 0) {
      metas[existingIdx] = meta;
    } else {
      metas.unshift(meta);
    }

    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(metas));
  }

  async deleteProject(id: string): Promise<void> {
    localStorage.removeItem(PROJECT_PREFIX + id);

    const metas = await this.listProjects();
    const filtered = metas.filter((m) => m.id !== id);
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(filtered));
  }
}
