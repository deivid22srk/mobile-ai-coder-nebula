// API client — thin wrapper over fetch for the Express backend.
// All paths go through Vite's /api proxy during dev (see vite.config.ts).

import type {
  AppConfig,
  Chat,
  FileNode,
  GitHubStatus,
  Memory,
  Message,
  Skill,
  SSEEvent
} from './types';

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch (_) {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

// Chats
export const api = {
  async listChats(): Promise<Chat[]> {
    return jsonOrThrow(await fetch('/api/chats'));
  },

  async createChat(title: string): Promise<Chat> {
    return jsonOrThrow(await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    }));
  },

  async getChat(id: number): Promise<Chat> {
    return jsonOrThrow(await fetch(`/api/chats/${id}`));
  },

  async deleteChat(id: number): Promise<void> {
    await jsonOrThrow(await fetch(`/api/chats/${id}`, { method: 'DELETE' }));
  },

  // Settings
  async getSettings(): Promise<AppConfig> {
    return jsonOrThrow(await fetch('/api/settings'));
  },

  async saveSettings(config: Partial<AppConfig>): Promise<AppConfig> {
    const data = await jsonOrThrow<{ config: AppConfig }>(await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }));
    return data.config;
  },

  // Models
  async listModels(): Promise<{
    success: boolean;
    models: string[];
    provider?: string;
    cached?: boolean;
    errorCode?: string;
    error?: string;
  }> {
    return jsonOrThrow(await fetch('/api/models'));
  },

  // Health check
  async health(): Promise<{
    ok: boolean;
    version: string;
    provider: string;
    hasApiUrl: boolean;
    hasApiKey: boolean;
    model: string | null;
    workspacePath: string | null;
    githubConnected: boolean;
    uptime: number;
    timestamp: string;
  }> {
    return jsonOrThrow(await fetch('/api/health'));
  },

  // Skills
  async listSkills(): Promise<Skill[]> {
    const data = await jsonOrThrow<{ skills: Skill[] }>(await fetch('/api/skills'));
    return data.skills;
  },

  async getChatSkills(chatId: number): Promise<string[]> {
    const data = await jsonOrThrow<{ active: string[] }>(await fetch(`/api/chats/${chatId}/skills`));
    return data.active;
  },

  async setChatSkill(chatId: number, name: string, active: boolean): Promise<void> {
    await jsonOrThrow(await fetch(`/api/chats/${chatId}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, active })
    }));
  },

  async createSkill(name: string, description: string, content: string): Promise<void> {
    await jsonOrThrow(await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, content })
    }));
  },

  async importSkillFromUrl(url: string): Promise<void> {
    await jsonOrThrow(await fetch('/api/skills/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }));
  },

  async deleteSkill(name: string): Promise<void> {
    await jsonOrThrow(await fetch(`/api/skills/${name}`, { method: 'DELETE' }));
  },

  async listSkillsCatalog(): Promise<Record<string, string[]>> {
    return jsonOrThrow(await fetch('/api/skills/catalog'));
  },

  async importFromCatalog(name: string, category: string): Promise<void> {
    await jsonOrThrow(await fetch('/api/skills/import-from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    }));
  },

  // Memories
  async listMemories(scope = 'global', chatId?: number): Promise<Memory[]> {
    const params = new URLSearchParams({ scope });
    if (chatId) params.set('chatId', String(chatId));
    const data = await jsonOrThrow<{ memories: Memory[] }>(await fetch(`/api/memories?${params}`));
    return data.memories;
  },

  async saveMemory(memory: Partial<Memory>): Promise<void> {
    await jsonOrThrow(await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory)
    }));
  },

  async deleteMemory(id: number): Promise<void> {
    await jsonOrThrow(await fetch(`/api/memories/${id}`, { method: 'DELETE' }));
  },

  // GitHub
  async getGitHubStatus(): Promise<GitHubStatus> {
    return jsonOrThrow(await fetch('/api/github/status'));
  },

  async connectGitHub(token: string): Promise<{ user: any }> {
    return jsonOrThrow(await fetch('/api/github/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }));
  },

  async disconnectGitHub(): Promise<void> {
    await jsonOrThrow(await fetch('/api/github/disconnect', { method: 'POST' }));
  },

  // Files
  async listFiles(): Promise<{ workspace: string; files: FileNode[] }> {
    return jsonOrThrow(await fetch('/api/files'));
  },

  async viewFile(path: string): Promise<{ path: string; content: string }> {
    return jsonOrThrow(await fetch(`/api/file/view?path=${encodeURIComponent(path)}`));
  },

  async writeFile(path: string, content: string): Promise<void> {
    await jsonOrThrow(await fetch('/api/file/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    }));
  },

  // Terminal
  async runTerminal(command: string): Promise<{ output: string }> {
    return jsonOrThrow(await fetch('/api/terminal/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    }));
  },

  // Chat status
  async getChatStatus(chatId: number): Promise<{ running: boolean }> {
    return jsonOrThrow(await fetch(`/api/chat/status?chatId=${chatId}`));
  },

  async cancelChat(chatId: number): Promise<void> {
    await jsonOrThrow(await fetch('/api/chat/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId })
    }));
  },

  // Chat SSE — returns an async generator of SSE events.
  // The backend writes `data: { ... }\n\n` chunks; we parse them here.
  async *streamChat(
    chatId: number | null,
    messages: Message[],
    reconnect = false,
    signal?: AbortSignal
  ): AsyncGenerator<SSEEvent> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ chatId, messages, reconnect }),
      signal
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Chat stream failed: HTTP ${res.status} ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by a blank line. Each chunk may contain
      // multiple events or partial events; we split on \n\n and keep the tail.
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        // Each event payload begins with "data: "
        for (const line of trimmed.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          try {
            const event = JSON.parse(dataStr) as SSEEvent;
            yield event;
          } catch (err) {
            console.warn('Failed to parse SSE chunk:', dataStr, err);
          }
        }
      }
    }
  }
};
