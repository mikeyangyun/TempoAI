import { AgentContext, AgentResult } from '@/types';
import { LLMProvider } from '@/lib/llm/types';
import { createLLMProvider } from '@/lib/llm';
import { CodeGeneratorAgent } from './code-generator';
import { CodeModifierAgent } from './code-modifier';
import { BaseAgent } from './types';

export class Orchestrator {
  private llm: LLMProvider;
  private codeGenerator: BaseAgent;
  private codeModifier: BaseAgent;

  constructor(llm?: LLMProvider) {
    this.llm = llm || createLLMProvider();
    this.codeGenerator = new CodeGeneratorAgent(this.llm);
    this.codeModifier = new CodeModifierAgent(this.llm);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const agent = this.selectAgent(context);
    const result = await agent.execute(context);
    return { ...result, agentName: agent.name };
  }

  private selectAgent(context: AgentContext): BaseAgent {
    if (context.currentHtml) {
      return this.codeModifier;
    }
    return this.codeGenerator;
  }
}
