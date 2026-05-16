import { ParseResult, FileMap } from '@/types';

const FENCE_OPEN = /```html\s*\n?/;
const FENCE_CLOSE = /\n?```/;

/**
 * Extracts HTML content from a markdown-fenced code block (legacy single-file).
 */
export function parseHtmlFence(text: string): ParseResult {
  const openMatch = text.match(FENCE_OPEN);

  if (!openMatch || openMatch.index === undefined) {
    if (text.length < 200) {
      return { status: 'streaming', partial: '', raw: text };
    }
    return { status: 'error', raw: text };
  }

  const contentStart = openMatch.index + openMatch[0].length;
  const afterOpen = text.slice(contentStart);

  const closeMatch = afterOpen.match(FENCE_CLOSE);

  if (!closeMatch || closeMatch.index === undefined) {
    return {
      status: 'streaming',
      partial: afterOpen,
      raw: text,
    };
  }

  const html = afterOpen.slice(0, closeMatch.index);

  if (!html.trim()) {
    return { status: 'error', raw: text };
  }

  return {
    status: 'complete',
    html: html.trim(),
    raw: text,
  };
}

/**
 * Parse multi-file fenced output: ```language:filename
 * Returns a map of filename -> { language, content }
 */
export function parseMultiFileFence(text: string): FileMap {
  const files: FileMap = {};
  // Match ```lang:filename\n...content...\n```
  const regex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1];
    const filename = match[2].trim();
    const content = match[3].trim();
    files[filename] = { language, content };
  }

  return files;
}

/**
 * Detect whether the LLM output uses multi-file format (```lang:filename)
 */
export function isMultiFileFormat(text: string): boolean {
  return /```\w+:[^\n]+\n/.test(text);
}

/**
 * Merge multiple files into a single HTML document for iframe rendering.
 * Injects CSS into <style> and JS into <script> within the HTML.
 */
export function mergeFilesToHtml(files: FileMap): string {
  const htmlFile = files['index.html'];
  if (!htmlFile) {
    // Fallback: if no index.html, try to construct from parts
    const css = Object.entries(files)
      .filter(([, f]) => f.language === 'css')
      .map(([, f]) => f.content)
      .join('\n');
    const js = Object.entries(files)
      .filter(([, f]) => f.language === 'javascript' || f.language === 'js')
      .map(([, f]) => f.content)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${css}</style>
</head>
<body>
<script>${js}</script>
</body>
</html>`;
  }

  let html = htmlFile.content;

  // Replace <link rel="stylesheet" href="style.css"> with inline <style>
  const cssFiles = Object.entries(files).filter(([, f]) => f.language === 'css');
  for (const [filename, file] of cssFiles) {
    const linkRegex = new RegExp(`<link[^>]*href=["']${escapeRegex(filename)}["'][^>]*/?>`, 'g');
    html = html.replace(linkRegex, `<style>\n${file.content}\n</style>`);
  }

  // Replace <script src="script.js"></script> with inline <script>
  const jsFiles = Object.entries(files).filter(
    ([, f]) => f.language === 'javascript' || f.language === 'js'
  );
  for (const [filename, file] of jsFiles) {
    const scriptRegex = new RegExp(
      `<script[^>]*src=["']${escapeRegex(filename)}["'][^>]*>\\s*</script>`,
      'g'
    );
    html = html.replace(scriptRegex, `<script>\n${file.content}\n</script>`);
  }

  return html;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasHtmlFence(text: string): boolean {
  return FENCE_OPEN.test(text);
}

export function isFenceComplete(text: string): boolean {
  const result = parseHtmlFence(text);
  return result.status === 'complete';
}
