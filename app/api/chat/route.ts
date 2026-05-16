import { NextRequest, NextResponse } from 'next/server';
import { Orchestrator } from '@/lib/agents/orchestrator';
import { SprintOrchestrator } from '@/lib/agents/team/sprint-orchestrator';
import { ChatMessage, AgentContext, ChatMode, SprintContext } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, currentHtml, mode, sprintContext, baAnswer } = body as {
      messages: ChatMessage[];
      currentHtml?: string | null;
      mode?: ChatMode;
      sprintContext?: SprintContext;
      baAnswer?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: No LLM API key set. Please add DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY to .env.local.' },
        { status: 500 }
      );
    }

    const context: AgentContext = {
      messages,
      currentHtml: currentHtml || null,
      mode: mode || 'build',
    };

    let stream: AsyncIterable<string>;
    let agentName: string;

    if (mode === 'plan') {
      const orchestrator = new Orchestrator();
      const result = await orchestrator.execute(context);
      stream = result.stream;
      agentName = result.agentName || 'PlannerAgent';
    } else {
      const sprint = new SprintOrchestrator();
      stream = sprint.executeSprint(context, sprintContext, baAnswer);
      agentName = 'SprintTeam';
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('[API/chat] Stream error:', error);
          const message =
            error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encode(`\n\n[ERROR: ${message}]`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        'X-Agent-Name': agentName,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    const safeMessage = message.includes('API key')
      ? 'Server configuration error. Please check your environment variables.'
      : message;

    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
