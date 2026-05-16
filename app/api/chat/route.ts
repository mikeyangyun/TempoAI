import { NextRequest, NextResponse } from 'next/server';
import { Orchestrator } from '@/lib/agents/orchestrator';
import { ChatMessage, AgentContext } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, currentHtml } = body as {
      messages: ChatMessage[];
      currentHtml?: string | null;
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

    const orchestrator = new Orchestrator();

    const context: AgentContext = {
      messages,
      currentHtml: currentHtml || null,
    };

    const { stream } = await orchestrator.execute(context);

    // Convert AsyncIterable to ReadableStream for the response
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
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
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    // Don't expose internal details for auth/config errors
    const safeMessage = message.includes('API key')
      ? 'Server configuration error. Please check your environment variables.'
      : message;

    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
