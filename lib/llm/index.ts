import { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenRouterProvider } from './openrouter';

/**
 * Creates the appropriate LLM provider based on available environment variables.
 * Priority: ANTHROPIC_API_KEY > OPENROUTER_API_KEY
 */
export function createLLMProvider(): LLMProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider();
  }
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenRouterProvider();
  }
  throw new Error(
    'No LLM API key configured. Please set ANTHROPIC_API_KEY or OPENROUTER_API_KEY in your .env.local file.'
  );
}
