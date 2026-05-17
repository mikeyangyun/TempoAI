import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_TL } from './prompts';

export class TLAgent {
  readonly name = 'Sarah';
  readonly role = 'Tech Lead';
  readonly roleKey = 'tl' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, isIteration?: boolean): AsyncIterable<string> {
    const iterationNote = isIteration
      ? '\n\nNOTE: This is an iteration. Preserve the existing architecture. Only describe changes needed.'
      : '';

    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_TL },
      {
        role: 'user',
        content: `Here is the BA's requirement analysis:\n\n${baOutput}\n\nPlease create the technical architecture and implementation plan.${iterationNote}`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
