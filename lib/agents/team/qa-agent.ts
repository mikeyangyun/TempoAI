import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_QA } from './prompts';

const QA_OPTIONS = { temperature: 0.3 };

export class QAAgent {
  readonly name = 'Chris';
  readonly role = 'QA Engineer';
  readonly roleKey = 'qa' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, uiuxOutput: string, code: string, previousCode?: string | null): AsyncIterable<string> {
    let userContent: string;

    if (previousCode) {
      userContent = `Validate the developer's updated code. This is an ITERATION — check ALL of the following:\n1. BA's acceptance criteria are met\n2. UI/UX design specs are applied\n3. Existing features from the previous version still work (regression)\n\n## BA Requirements & Acceptance Criteria\n${baOutput}\n\n## UI/UX Design Specs\n${uiuxOutput}\n\n## Previous Working Code (check for regression)\n${previousCode}\n\n## Developer's New Code\n${code}\n\nFAIL if any acceptance criterion is unmet, design specs are ignored, or existing features are broken.`;
    } else {
      userContent = `Validate the developer's code against ALL of these specs:\n\n## BA Requirements & Acceptance Criteria\n${baOutput}\n\n## UI/UX Design Specs\n${uiuxOutput}\n\n## Developer's Code\n${code}\n\nCheck every feature, every acceptance criterion, and verify the UI/UX design is properly applied. Provide the verdict.`;
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_QA },
      { role: 'user', content: userContent },
    ];

    yield* this.llm.streamChat(messages, QA_OPTIONS);
  }
}
