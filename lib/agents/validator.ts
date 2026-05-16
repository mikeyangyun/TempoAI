import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { SYSTEM_PROMPT_VALIDATE, SYSTEM_PROMPT_FIX } from '@/lib/llm/prompts';

export interface ValidationResult {
  passed: boolean;
  feedback: string;
}

export class ValidatorAgent {
  readonly name = 'Validator';
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async validate(code: string, userRequest: string): Promise<ValidationResult> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_VALIDATE },
      {
        role: 'user',
        content: `User's original request: "${userRequest}"\n\nGenerated code to review:\n\n${code}`,
      },
    ];

    let fullResponse = '';
    for await (const chunk of this.llm.streamChat(messages, { temperature: 0.1 })) {
      fullResponse += chunk;
    }

    const passed = fullResponse.includes('[VALIDATION:PASS]');
    return { passed, feedback: fullResponse };
  }

  async *fix(code: string, feedback: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_FIX },
      {
        role: 'user',
        content: `Here is the code that failed validation:\n\n${code}\n\nValidation feedback:\n${feedback}\n\nPlease fix all the issues.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
