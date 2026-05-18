import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { PROMPT_DEV } from './prompts';

const DEV_OPTIONS = { temperature: 0.3 };

export class DevAgent {
  readonly name = 'Jordan';
  readonly role = 'Full-Stack Developer';
  readonly roleKey = 'dev' as const;

  constructor(private llm: LLMProvider) {}

  async *execute(baOutput: string, tlOutput: string, uiuxOutput: string, existingCode?: string | null): AsyncIterable<string> {
    let userContent: string;

    if (existingCode) {
      userContent = `ITERATION: Modify the existing application. You MUST keep ALL existing features working.\n\n## Current Code\n${existingCode}\n\n## Changes Requested (BA)\n${baOutput}\n\n## Tech Notes (TL)\n${tlOutput}\n\n## Design Updates (UI/UX)\n${uiuxOutput}\n\nOutput the COMPLETE updated files. Do not remove any existing functionality.`;
    } else {
      userContent = `Build the application based on these team specs:\n\n## BA Requirements\n${baOutput}\n\n## Tech Architecture\n${tlOutput}\n\n## UI/UX Design\n${uiuxOutput}\n\nImplement the complete application now.`;
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_DEV },
      { role: 'user', content: userContent },
    ];

    yield* this.llm.streamChat(messages, DEV_OPTIONS);
  }

  async *fix(code: string, qaFeedback: string, baOutput?: string, uiuxOutput?: string, tlOutput?: string): AsyncIterable<string> {
    let contextSection = '';
    if (baOutput) contextSection += `\n## BA Requirements (reference)\n${baOutput}\n`;
    if (uiuxOutput) contextSection += `\n## UI/UX Design Specs (reference)\n${uiuxOutput}\n`;
    if (tlOutput) contextSection += `\n## Tech Architecture (reference)\n${tlOutput}\n`;

    const messages: LLMMessage[] = [
      { role: 'system', content: PROMPT_DEV },
      {
        role: 'user',
        content: `The QA engineer found issues with your code. Fix ALL reported issues and output the complete corrected files.\n\n## QA Feedback (FIX EVERY ISSUE LISTED)\n${qaFeedback}${contextSection}\n## Current Code\n${code}\n\nAddress every QA issue. Output the COMPLETE corrected files.`,
      },
    ];

    yield* this.llm.streamChat(messages, DEV_OPTIONS);
  }
}
