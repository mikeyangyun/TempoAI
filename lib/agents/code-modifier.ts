import { AgentContext, AgentResult } from '@/types';
import { BaseAgent } from './types';
import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { buildModifyPrompt } from '@/lib/llm/prompts';

export class CodeModifierAgent implements BaseAgent {
  readonly name = 'CodeModifier';
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    if (!context.currentHtml) {
      throw new Error('CodeModifierAgent requires currentHtml in context.');
    }

    const systemPrompt = buildModifyPrompt(context.currentHtml);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = this.llm.streamChat(messages, context.options);
    return { stream };
  }
}
