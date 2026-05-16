import { AgentContext, AgentResult } from '@/types';
import { LLMProvider } from '@/lib/llm/types';
import { createLLMProvider } from '@/lib/llm';
import { CodeGeneratorAgent } from './code-generator';
import { CodeModifierAgent } from './code-modifier';
import { PlannerAgent } from './planner';
import { ValidatorAgent } from './validator';
import { BaseAgent } from './types';

const MAX_FIX_ATTEMPTS = 2;

export class Orchestrator {
  private llm: LLMProvider;
  private codeGenerator: BaseAgent;
  private codeModifier: BaseAgent;
  private planner: BaseAgent;
  private validator: ValidatorAgent;

  constructor(llm?: LLMProvider) {
    this.llm = llm || createLLMProvider();
    this.codeGenerator = new CodeGeneratorAgent(this.llm);
    this.codeModifier = new CodeModifierAgent(this.llm);
    this.planner = new PlannerAgent(this.llm);
    this.validator = new ValidatorAgent(this.llm);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const agent = this.selectAgent(context);

    if (context.mode === 'plan') {
      const result = await agent.execute(context);
      return { ...result, agentName: agent.name };
    }

    const self = this;
    const stream = (async function* () {
      let fullContent = '';
      const codeResult = await agent.execute(context);

      for await (const chunk of codeResult.stream) {
        fullContent += chunk;
        yield chunk;
      }

      const userRequest = context.messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n');

      let currentCode = fullContent;

      for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS; attempt++) {
        yield `\n[PHASE:validating]\n`;

        const validationResult = await self.validator.validate(currentCode, userRequest);

        if (validationResult.passed) {
          yield `\n[PHASE:validated]\n`;
          return;
        }

        yield `\n[PHASE:fixing:${attempt + 1}]\n`;
        yield `\n[VALIDATION_FEEDBACK:${validationResult.feedback}]\n`;

        let fixContent = '';
        for await (const chunk of self.validator.fix(currentCode, validationResult.feedback)) {
          fixContent += chunk;
          yield chunk;
        }

        currentCode = fixContent;
      }

      yield `\n[PHASE:validated]\n`;
    })();

    return { stream, agentName: agent.name };
  }

  private selectAgent(context: AgentContext): BaseAgent {
    if (context.mode === 'plan') {
      return this.planner;
    }
    if (context.currentHtml) {
      return this.codeModifier;
    }
    return this.codeGenerator;
  }
}
