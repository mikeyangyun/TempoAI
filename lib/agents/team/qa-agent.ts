import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_QA } from './prompts';

export class QAAgent {
  readonly name = 'Chris';
  readonly role = 'QA Engineer';
  readonly roleKey = 'qa' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, code: string, previousCode?: string | null): AsyncIterable<string> {
    let userContent: string;

    if (previousCode) {
      userContent = `Validate the developer's updated code. This is an ITERATION — check BOTH:\n1. New requirements are met\n2. Existing features from the previous version still work (regression check)\n\n## New/Changed Requirements\n${baOutput}\n\n## Updated Code\n${code}\n\nFAIL if any existing feature is broken or new requirements are not met.`;
    } else {
      userContent = `Validate the developer's code against the BA requirements.\n\n## BA Requirements & Acceptance Criteria\n${baOutput}\n\n## Developer's Code\n${code}\n\nProvide the verdict.`;
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_QA },
      { role: 'user', content: userContent },
    ];

    yield* this.llm.streamChat(messages);
  }
}
