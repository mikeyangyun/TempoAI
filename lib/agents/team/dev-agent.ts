import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_DEV } from './prompts';

export class DevAgent {
  readonly name = 'Jordan';
  readonly role = 'Full-Stack Developer';
  readonly roleKey = 'dev' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, tlOutput: string, uiuxOutput: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_DEV },
      {
        role: 'user',
        content: `Build the application based on these team specs:\n\n## BA Requirements\n${baOutput}\n\n## Tech Architecture\n${tlOutput}\n\n## UI/UX Design\n${uiuxOutput}\n\nImplement the complete application now.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }

  async *fix(code: string, qaFeedback: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_DEV },
      {
        role: 'user',
        content: `The QA engineer found issues with your code. Fix them and output the complete corrected files.\n\n## QA Feedback\n${qaFeedback}\n\n## Current Code\n${code}\n\nOutput the corrected files in the same format.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
