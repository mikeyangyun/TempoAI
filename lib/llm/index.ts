import { LLMProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { OpenRouterProvider } from './openrouter';

/**
 * Creates the appropriate LLM provider based on available environment variables.
 * Priority: DEEPSEEK > ANTHROPIC > OPENROUTER
 */
export function createLLMProvider(): LLMProvider {
  if (process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekProvider();
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider();
  }
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenRouterProvider();
  }
  throw new Error(
    'No LLM API key configured. Please set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY in your .env.local file.'
  );
}
