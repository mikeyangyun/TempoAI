export interface PreviewEngine {
  inject(html: string): void;
  reload(): void;
  openInNewTab(): void;
  getScreenshot?(): Promise<Blob>;
}
