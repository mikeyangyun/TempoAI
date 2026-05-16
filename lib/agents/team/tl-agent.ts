import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_TL } from './prompts';

export class TLAgent {
  readonly name = 'Sarah';
  readonly role = 'Tech Lead';
  readonly roleKey = 'tl' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_TL },
      {
        role: 'user',
        content: `Here is the BA's requirement analysis:\n\n${baOutput}\n\nPlease create the technical architecture and implementation plan.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
