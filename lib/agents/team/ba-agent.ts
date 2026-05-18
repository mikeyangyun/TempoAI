import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_BA } from './prompts';

export class BAAgent {
  readonly name = 'Mike';
  readonly role = 'Business Analyst';
  readonly roleKey = 'ba' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(userRequest: string, previousContext?: string, isIteration?: boolean): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_BA },
    ];

    if (isIteration && previousContext) {
      messages.push({
        role: 'user',
        content: `This is an ITERATION on an existing app. Previous sprint delivered these features:\n${previousContext}\n\nThe user now wants: "${userRequest}"\n\nIMPORTANT: First assess if the request is clear enough. If the user only said something vague like "add something" or "I want to change" without specifying WHAT — use Category C with [BA:REJECT] markers. Only proceed if you clearly understand what specific change they want.`,
      });
    } else if (previousContext) {
      messages.push({
        role: 'user',
        content: `Previous sprint context:\n${previousContext}\n\nNew request: "${userRequest}"\n\nAssess intent clarity first.`,
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
