import { Project, ProjectMeta } from '@/types';
import { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local-storage';
import { IndexedDBStore } from './indexed-db';

const HTML_SIZE_THRESHOLD = 50_000; // 50KB — above this, use IndexedDB

/**
 * Combined storage facade:
 * - Project metadata + small HTML → localStorage
 * - Large HTML payloads → IndexedDB
 */
class StorageFacade implements StorageAdapter {
  private ls = new LocalStorageAdapter();
  private idb = new IndexedDBStore();

  async listProjects(): Promise<ProjectMeta[]> {
    return this.ls.listProjects();
  }

  async getProject(id: string): Promise<Project | null> {
    const project = await this.ls.getProject(id);
    if (!project) return null;

    // If HTML was offloaded to IndexedDB, retrieve it
    if (project.currentHtml === '__IDB__') {
      const html = await this.idb.get(`html_current_${id}`);
      project.currentHtml = html;
    }

    // Restore versions from IndexedDB if needed
    for (let i = 0; i < project.versions.length; i++) {
      if (project.versions[i].html === '__IDB__') {
        const html = await this.idb.get(`html_version_${id}_${i}`);
        project.versions[i].html = html || '';
      }
    }

    return project;
  }

  async saveProject(project: Project): Promise<void> {
    const toSave = { ...project, versions: [...project.versions] };

    // Offload large HTML to IndexedDB
    if (toSave.currentHtml && toSave.currentHtml.length > HTML_SIZE_THRESHOLD) {
      await this.idb.set(`html_current_${project.id}`, toSave.currentHtml);
      toSave.currentHtml = '__IDB__';
    }

    for (let i = 0; i < toSave.versions.length; i++) {
      if (toSave.versions[i].html.length > HTML_SIZE_THRESHOLD) {
        await this.idb.set(`html_version_${project.id}_${i}`, toSave.versions[i].html);
        toSave.versions[i] = { ...toSave.versions[i], html: '__IDB__' };
      }
    }

    await this.ls.saveProject(toSave as Project);
  }

  async deleteProject(id: string): Promise<void> {
    await this.ls.deleteProject(id);
    await this.idb.delete(`html_current_${id}`);
    await this.idb.deleteByPrefix(`html_version_${id}_`);
  }
}

// Singleton instance
let storageInstance: StorageFacade | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new StorageFacade();
  }
  return storageInstance;
}
