import { LLMOptions } from '@/types';
import { LLMMessage, LLMProvider } from './types';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

export class DeepSeekProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error(
        'DEEPSEEK_API_KEY is not set. Please add it to your .env.local file.'
      );
    }
    this.apiKey = key;
    this.defaultModel = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  }

  async *streamChat(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string> {
    const model = options?.model || this.defaultModel;
    const signal = options?.signal;

    const body = JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      ...(options?.maxTokens && { max_tokens: options.maxTokens }),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

    let response: Response;
    try {
      response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body,
        signal: combinedSignal,
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out (120s). The prompt may be too long.');
      }
      throw error;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const status = response.status;

      if (status === 401) {
        throw new Error('Invalid API key. Please check your DEEPSEEK_API_KEY.');
      }
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (status >= 500) {
        throw new Error(`DeepSeek service error (${status}). Please try again later.`);
      }
      throw new Error(
        `LLM request failed (${status}): ${errorBody.slice(0, 200)}`
      );
    }

    clearTimeout(timeout);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body received from LLM.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
