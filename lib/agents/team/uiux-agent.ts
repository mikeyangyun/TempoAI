import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_UIUX } from './prompts';

export class UIUXAgent {
  readonly name = 'Alex';
  readonly role = 'UI/UX Designer';
  readonly roleKey = 'uiux' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, tlOutput: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_UIUX },
      {
        role: 'user',
        content: `BA Requirements:\n${baOutput}\n\nTech Lead Architecture:\n${tlOutput}\n\nPlease create the UI/UX design specification.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
