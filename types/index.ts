export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  rawContent?: string;
  agentName?: string;
  sprintRaw?: string;
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

export type FileEntry = {
  language: string;
  content: string;
};

export type FileMap = Record<string, FileEntry>;

export type LLMOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type ChatMode = 'plan' | 'build';

export type AgentContext = {
  messages: ChatMessage[];
  currentHtml: string | null;
  options?: LLMOptions;
  mode?: ChatMode;
};

export type AgentResult = {
  stream: AsyncIterable<string>;
  agentName?: string;
};

export type TeamRole = 'ba' | 'tl' | 'uiux' | 'dev' | 'qa';

export type SprintRoleOutput = {
  role: TeamRole;
  content: string;
};

export type SprintContext = {
  roleOutputs: SprintRoleOutput[];
  userAnswers?: string[];
  sprintNumber: number;
};
