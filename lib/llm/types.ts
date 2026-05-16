import { ChatMessage, LLMOptions } from '@/types';

export interface LLMProvider {
  streamChat(
    messages: ChatMessage[],
    options?: LLMOptions
  ): AsyncIterable<string>;
}
