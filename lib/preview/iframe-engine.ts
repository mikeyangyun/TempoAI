import { PreviewEngine } from './types';

export class IframePreviewEngine implements PreviewEngine {
  private iframe: HTMLIFrameElement | null = null;
  private currentHtml: string | null = null;

  bind(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  inject(html: string): void {
    this.currentHtml = html;
    if (this.iframe) {
      this.iframe.srcdoc = html;
    }
  }

  reload(): void {
    if (this.iframe && this.currentHtml) {
      // Force reload by clearing and re-setting srcdoc
      this.iframe.srcdoc = '';
      requestAnimationFrame(() => {
        if (this.iframe && this.currentHtml) {
          this.iframe.srcdoc = this.currentHtml;
        }
      });
    }
  }

  openInNewTab(): void {
    if (!this.currentHtml) return;
    const blob = new Blob([this.currentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  getCurrentHtml(): string | null {
    return this.currentHtml;
  }
}
