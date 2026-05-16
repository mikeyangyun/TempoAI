import { LLMOptions } from '@/types';
import { LLMMessage, LLMProvider } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please add it to your .env.local file.'
      );
    }
    this.apiKey = key;
    this.defaultModel = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  async *streamChat(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string> {
    const model = options?.model || this.defaultModel;
    const signal = options?.signal;

    // Anthropic API separates system message from the messages array
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const body = JSON.stringify({
      model,
      system: systemMessage?.content || '',
      messages: chatMessages,
      stream: true,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
    });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const status = response.status;

      if (status === 401) {
        throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY.');
      }
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (status >= 500) {
        throw new Error(`Anthropic service error (${status}). Please try again later.`);
      }
      throw new Error(
        `LLM request failed (${status}): ${errorBody.slice(0, 200)}`
      );
    }

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

            // Anthropic SSE event types
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text;
              if (text) {
                yield text;
              }
            } else if (parsed.type === 'message_stop') {
              return;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error?.message || 'Stream error from Anthropic');
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('Stream error')) throw e;
            // Skip malformed JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
