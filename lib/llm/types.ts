import { LLMOptions } from '@/types';

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface LLMProvider {
  streamChat(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string>;
}
