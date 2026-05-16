import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_BA } from './prompts';

export class BAAgent {
  readonly name = 'Mike';
  readonly role = 'Business Analyst';
  readonly roleKey = 'ba' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(userRequest: string, previousContext?: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_BA },
    ];

    if (previousContext) {
      messages.push({
        role: 'user',
        content: `Previous sprint context:\n${previousContext}\n\nNew request: ${userRequest}`,
      });
    } else {
      messages.push({ role: 'user', content: userRequest });
    }

    yield* this.llm.streamChat(messages);
  }

  async *continueWithAnswer(originalRequest: string, answer: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_BA },
      { role: 'user', content: originalRequest },
      { role: 'assistant', content: 'I had some clarifying questions.' },
      { role: 'user', content: `Here are my answers:\n${answer}\n\nPlease now produce the full requirement analysis.` },
    ];

    yield* this.llm.streamChat(messages);
  }
}
