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

  async *reviewFailures(baOutput: string, qaFeedback: string, failedCode: string): AsyncIterable<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_TL },
      {
        role: 'user',
        content: `ESCALATION: The developer has failed QA 3 times. I need you to review the situation and provide a revised technical plan.

## BA Requirements
${baOutput}

## QA's Latest Feedback (issues that keep failing)
${qaFeedback}

## Developer's Latest Code (still has issues)
${failedCode}

Analyze the root cause of the repeated failures. Provide a REVISED technical approach that specifically addresses the QA issues. Focus on what the developer is doing wrong and how to fix it structurally.`,
      },
    ];

    yield* this.llm.streamChat(messages);
  }
}
