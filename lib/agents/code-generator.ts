import { AgentContext, AgentResult } from '@/types';
import { BaseAgent } from './types';
import { LLMProvider, LLMMessage } from '@/lib/llm/types';
import { SYSTEM_PROMPT_GENERATE } from '@/lib/llm/prompts';

export class CodeGeneratorAgent implements BaseAgent {
  readonly name = 'CodeGenerator';
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT_GENERATE },
      ...context.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = this.llm.streamChat(messages, context.options);
    return { stream };
  }
}
