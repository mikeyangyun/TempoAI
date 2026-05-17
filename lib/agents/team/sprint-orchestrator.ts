import { LLMProvider } from '@/lib/llm/types';
import { createLLMProvider } from '@/lib/llm';
import { AgentContext, SprintContext, TeamRole } from '@/types';
import { BAAgent } from './ba-agent';
import { TLAgent } from './tl-agent';
import { UIUXAgent } from './uiux-agent';
import { DevAgent } from './dev-agent';
import { QAAgent } from './qa-agent';

const MAX_QA_RETRIES = 3;

type RoleInfo = { role: TeamRole; name: string; title: string };

const ROLE_META: RoleInfo[] = [
  { role: 'ba', name: 'Mike', title: 'Business Analyst' },
  { role: 'tl', name: 'Sarah', title: 'Tech Lead' },
  { role: 'uiux', name: 'Alex', title: 'UI/UX Designer' },
  { role: 'dev', name: 'Jordan', title: 'Full-Stack Developer' },
  { role: 'qa', name: 'Chris', title: 'QA Engineer' },
];

export class SprintOrchestrator {
  private llm: LLMProvider;
  private ba: BAAgent;
  private tl: TLAgent;
  private uiux: UIUXAgent;
  private dev: DevAgent;
  private qa: QAAgent;

  constructor(llm?: LLMProvider) {
    this.llm = llm || createLLMProvider();
    this.ba = new BAAgent(this.llm);
    this.tl = new TLAgent(this.llm);
    this.uiux = new UIUXAgent(this.llm);
    this.dev = new DevAgent(this.llm);
    this.qa = new QAAgent(this.llm);
  }

  async *executeSprint(
    context: AgentContext,
    sprintContext?: SprintContext,
    baAnswer?: string,
  ): AsyncIterable<string> {
    const userRequest = context.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const existingCode = context.currentHtml || null;
    const isIteration = !!existingCode || !!sprintContext;

    const previousContext = sprintContext?.roleOutputs
      ?.map((o) => `[${o.role.toUpperCase()}]: ${o.content}`)
      .join('\n\n');

    // --- BA Phase ---
    yield this.phaseMarker('ba', 'start');

    let baOutput = '';

    if (baAnswer) {
      for await (const chunk of this.ba.continueWithAnswer(userRequest, baAnswer)) {
        baOutput += chunk;
        yield chunk;
      }
    } else {
      for await (const chunk of this.ba.execute(userRequest, previousContext, isIteration)) {
        baOutput += chunk;
        yield chunk;
      }
    }

    if (this.hasRejection(baOutput)) {
      yield this.phaseMarker('ba', 'reject');
      return;
    }

    if (this.hasQuestions(baOutput)) {
      yield this.phaseMarker('ba', 'question');
      return;
    }

    yield this.phaseMarker('ba', 'done');

    // --- TL Phase ---
    yield this.phaseMarker('tl', 'start');
    let tlOutput = '';
    for await (const chunk of this.tl.execute(baOutput, isIteration)) {
      tlOutput += chunk;
      yield chunk;
    }
    yield this.phaseMarker('tl', 'done');

    // --- UI/UX Phase ---
    yield this.phaseMarker('uiux', 'start');
    let uiuxOutput = '';
    for await (const chunk of this.uiux.execute(baOutput, tlOutput)) {
      uiuxOutput += chunk;
      yield chunk;
    }
    yield this.phaseMarker('uiux', 'done');

    // --- Dev Phase ---
    yield this.phaseMarker('dev', 'start');
    let devOutput = '';
    for await (const chunk of this.dev.execute(baOutput, tlOutput, uiuxOutput, existingCode)) {
      devOutput += chunk;
      yield chunk;
    }
    yield this.phaseMarker('dev', 'done');

    // --- QA Phase (with retry loop, max MAX_QA_RETRIES rounds) ---
    let currentCode = devOutput;
    let lastQaOutput = '';

    for (let attempt = 0; attempt < MAX_QA_RETRIES; attempt++) {
      yield this.phaseMarker('qa', 'start');
      lastQaOutput = '';
      for await (const chunk of this.qa.execute(baOutput, uiuxOutput, currentCode, existingCode)) {
        lastQaOutput += chunk;
        yield chunk;
      }

      if (lastQaOutput.includes('[QA:PASS]')) {
        yield this.phaseMarker('qa', 'pass');
        yield `\n[SPRINT:COMPLETE]\n`;
        return;
      }

      yield this.phaseMarker('qa', 'fail');

      // Dev fixes based on QA feedback
      yield this.phaseMarker('dev', 'fix');
      let fixOutput = '';
      for await (const chunk of this.dev.fix(currentCode, lastQaOutput, baOutput, uiuxOutput)) {
        fixOutput += chunk;
        yield chunk;
      }
      currentCode = fixOutput;
      yield this.phaseMarker('dev', 'done');
    }

    // --- Escalation: TL reviews after MAX_QA_RETRIES failures ---
    yield this.phaseMarker('tl', 'fix');
    let tlReviewOutput = '';
    for await (const chunk of this.tl.reviewFailures(baOutput, lastQaOutput, currentCode)) {
      tlReviewOutput += chunk;
      yield chunk;
    }
    yield this.phaseMarker('tl', 'done');

    // Dev rebuilds with TL's revised guidance
    yield this.phaseMarker('dev', 'fix');
    let rebuiltCode = '';
    for await (const chunk of this.dev.fix(currentCode, `TL REVIEW (revised approach):\n${tlReviewOutput}\n\nOriginal QA issues:\n${lastQaOutput}`, baOutput, uiuxOutput)) {
      rebuiltCode += chunk;
      yield chunk;
    }
    currentCode = rebuiltCode;
    yield this.phaseMarker('dev', 'done');

    // Final QA after TL escalation
    yield this.phaseMarker('qa', 'start');
    let finalQaOutput = '';
    for await (const chunk of this.qa.execute(baOutput, uiuxOutput, currentCode, existingCode)) {
      finalQaOutput += chunk;
      yield chunk;
    }

    if (finalQaOutput.includes('[QA:PASS]')) {
      yield this.phaseMarker('qa', 'pass');
      yield `\n[SPRINT:COMPLETE]\n`;
      return;
    }

    // Still failing — be honest with the user
    yield this.phaseMarker('qa', 'fail');
    yield `\n[SPRINT:INCOMPLETE]\n${finalQaOutput}\n`;
  }

  private hasQuestions(text: string): boolean {
    return text.includes('[QUESTIONS]') && text.includes('[/QUESTIONS]');
  }

  private hasRejection(text: string): boolean {
    return text.includes('[BA:REJECT]');
  }

  private phaseMarker(role: TeamRole, status: string): string {
    const meta = ROLE_META.find((r) => r.role === role)!;
    return `\n[TEAM:${role}:${status}:${meta.name}:${meta.title}]\n`;
  }
}
