import { ParseResult } from '@/types';

const FENCE_OPEN = /```html\s*\n?/;
const FENCE_CLOSE = /\n?```/;

/**
 * Extracts HTML content from a markdown-fenced code block.
 * Handles three states:
 * - complete: fence opened and closed, HTML extracted
 * - streaming: fence opened but not yet closed (partial content)
 * - error: no fence found at all
 */
export function parseHtmlFence(text: string): ParseResult {
  const openMatch = text.match(FENCE_OPEN);

  if (!openMatch || openMatch.index === undefined) {
    // No opening fence found — could still be streaming before the fence
    if (text.length < 200) {
      return { status: 'streaming', partial: '', raw: text };
    }
    return { status: 'error', raw: text };
  }

  const contentStart = openMatch.index + openMatch[0].length;
  const afterOpen = text.slice(contentStart);

  const closeMatch = afterOpen.match(FENCE_CLOSE);

  if (!closeMatch || closeMatch.index === undefined) {
    // Fence opened but not closed — still streaming
    return {
      status: 'streaming',
      partial: afterOpen,
      raw: text,
    };
  }

  // Fence opened and closed — extract complete HTML
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
 * Quick check if text likely contains an HTML fence (for streaming optimization).
 */
export function hasHtmlFence(text: string): boolean {
  return FENCE_OPEN.test(text);
}

/**
 * Check if the fence is complete (both open and close markers present).
 */
export function isFenceComplete(text: string): boolean {
  const result = parseHtmlFence(text);
  return result.status === 'complete';
}
