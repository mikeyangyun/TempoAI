export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type ProjectVersion = {
  html: string;
  timestamp: number;
};

export type Project = {
  id: string;
  title: string;
  messages: ChatMessage[];
  currentHtml: string | null;
  versions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
};

export type ProjectMeta = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type ParseResult =
  | { status: 'complete'; html: string; raw: string }
  | { status: 'streaming'; partial: string; raw: string }
  | { status: 'error'; raw: string };

export type LLMOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type AgentContext = {
  messages: ChatMessage[];
  currentHtml: string | null;
  options?: LLMOptions;
};

export type AgentResult = {
  stream: AsyncIterable<string>;
};
