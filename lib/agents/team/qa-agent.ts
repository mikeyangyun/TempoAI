import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_QA } from './prompts';

export class QAAgent {
  readonly name = 'Chris';
  readonly role = 'QA Engineer';
  readonly roleKey = 'qa' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, code: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_QA },
      {
        role: 'user',
        content: `Validate the developer's code against the BA requirements.\n\n## BA Requirements & Acceptance Criteria\n${baOutput}\n\n## Developer's Code\n${code}\n\nRun your tests and provide the verdict.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
