// Shared types — mirror the backend's data shapes for the API contract.

export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type MessageType = 'text' | 'tool_call' | 'tool_output';
export type Provider = 'custom' | 'opencode-zen';

export interface GitHubUser {
  login: string;
  name: string;
  avatarUrl?: string;
  htmlUrl?: string;
  publicRepos?: number;
}

export interface AppConfig {
  provider: Provider;
  apiUrl: string;
  apiKey: string;
  opencodeZenApiKey: string;
  model: string;
  systemPrompt: string;
  workspacePath: string;
  githubToken: string;
  githubUser: GitHubUser | null;
}

export interface Message {
  id?: number;
  chatId?: number;
  role: Role;
  content: string;
  type?: MessageType;
  createdAt?: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type?: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Chat {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

export interface Skill {
  name: string;
  description: string;
  content: string;
}

export interface Memory {
  id: number;
  name: string;
  content: string;
  scope: string;
  type: string;
  tags: string;
  chatId: number | null;
  createdAt?: string;
}

export interface FileNode {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export interface GitHubStatus {
  connected: boolean;
  user: GitHubUser | null;
  tokenPreview: string;
}

export type SSEEvent =
  | { type: 'status'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool_start'; id: string; name: string; args: any }
  | { type: 'tool_output'; id: string; name: string; output: string; content?: string }
  | { type: 'tool_end'; id: string; name: string; output: string }
  | { type: 'metadata'; startIndex?: number; chatId?: number }
  | { type: 'done'; chatId?: number }
  | { type: 'error'; content: string }
  | { type: 'cancelled'; chatId?: number }
  | { type: 'plan_update'; explanation: string; plan: Array<{ step: string; status: 'pending' | 'in_progress' | 'completed' }> }
  | { type: 'agent_spawned'; agent_id: string; nickname: string; task: string };

// Runtime UI helpers — not in DB
export interface UIToolCall {
  id: string;
  name: string;
  args: any;
  output: string;
  status: 'running' | 'done' | 'error';
}

export interface UIAgent {
  agentId: string;
  nickname: string;
  task: string;
}

export interface UIPlanStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface UIPlan {
  explanation: string;
  steps: UIPlanStep[];
}
