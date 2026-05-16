import { AgentContext, AgentResult } from '@/types';

export interface BaseAgent {
  readonly name: string;
  execute(context: AgentContext): Promise<AgentResult>;
}
