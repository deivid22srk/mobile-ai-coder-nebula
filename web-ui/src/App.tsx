import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import type {
  AppConfig,
  Chat,
  Message,
  UIAgent,
  UIPlan,
  UIToolCall
} from './types';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Composer from './components/Composer';
import MessageList from './components/MessageList';
import SettingsScreen from './components/SettingsScreen';
import ModelPickerModal from './components/ModelPickerModal';
import ExplorerModal from './components/ExplorerModal';
import TerminalModal from './components/TerminalModal';
import { Icon } from './components/Icon';

const SAMPLE_PROMPTS = [
  {
    title: 'Crie um app React',
    desc: 'Scaffold um projeto Vite + React + TypeScript no workspace'
  },
  {
    title: 'Revise meu código',
    desc: 'Leia os arquivos do workspace e sugira melhorias'
  },
  {
    title: 'Rode os testes',
    desc: 'Execute npm test e reporte os resultados'
  },
  {
    title: 'Push para o GitHub',
    desc: 'Crie um repositório e envie os arquivos do workspace'
  }
];

export default function App() {
  // App state
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [plan, setPlan] = useState<UIPlan | null>(null);
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal screens
  const [showSettings, setShowSettings] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Active skills for current chat
  const [activeSkills, setActiveSkills] = useState<string[]>([]);

  // For cancellation
  const abortRef = useRef<AbortController | null>(null);

  // Load settings, chats on mount
  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.getSettings();
        setConfig(cfg);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
      try {
        const cs = await api.listChats();
        setChats(cs);
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
    })();
  }, []);

  // When active chat changes, load messages + skills
  useEffect(() => {
    if (activeChatId == null) {
      setMessages([]);
      setActiveSkills([]);
      return;
    }
    (async () => {
      try {
        const chat = await api.getChat(activeChatId);
        setMessages(chat.messages || []);
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
      try {
        const skills = await api.getChatSkills(activeChatId);
        setActiveSkills(skills);
      } catch (err) {
        console.error('Failed to load chat skills:', err);
      }
    })();
  }, [activeChatId]);

  // Refresh chats list whenever messages change to keep titles fresh
  const refreshChats = async () => {
    try {
      const cs = await api.listChats();
      setChats(cs);
    } catch (_) {
      // ignore
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setPlan(null);
    setAgents([]);
    setActiveSkills([]);
    setSidebarOpen(false);
  };

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setPlan(null);
    setAgents([]);
    setSidebarOpen(false);
  };

  const handleDeleteChat = async (id: number) => {
    try {
      await api.deleteChat(id);
      if (activeChatId === id) {
        setActiveChatId(null);
        setMessages([]);
      }
      await refreshChats();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleCancel = async () => {
    if (activeChatId == null) return;
    try {
      abortRef.current?.abort();
      await api.cancelChat(activeChatId);
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || streaming) return;

    // Append user message immediately for UX
    const userMsg: Message = { role: 'user', content: text };
    const priorMessages = [...messages, userMsg];
    setMessages(priorMessages);
    setStreaming(true);
    setStatusText('Thinking...');
    setPlan(null);
    setAgents([]);

    const controller = new AbortController();
    abortRef.current = controller;

    // We render new assistant content as a separate message appended after the user msg.
    // The backend's `startIndex` tells us where this turn starts; we use it to slice
    // history when reconnecting. For a fresh send, we just append.
    let assistantText = '';
    let assistantReasoning = '';
    let toolCalls: UIToolCall[] = [];

    // Add an empty assistant message that we'll mutate as events stream in.
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      reasoning_content: '',
      tool_calls: []
    };
    setMessages([...priorMessages, assistantMsg]);

    try {
      const stream = api.streamChat(activeChatId, priorMessages, false, controller.signal);

      for await (const evt of stream) {
        switch (evt.type) {
          case 'metadata':
            if (evt.chatId && activeChatId == null) {
              setActiveChatId(evt.chatId);
              // After metadata, refresh chats list to include the newly created chat
              setTimeout(refreshChats, 200);
            }
            break;
          case 'status':
            setStatusText(evt.content);
            break;
          case 'reasoning':
            assistantReasoning += evt.content;
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                next[next.length - 1] = { ...last, reasoning_content: assistantReasoning };
              }
              return next;
            });
            break;
          case 'text':
            assistantText += evt.content;
            setStatusText('');
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                next[next.length - 1] = { ...last, content: assistantText };
              }
              return next;
            });
            break;
          case 'tool_start': {
            toolCalls = [...toolCalls, {
              id: evt.id,
              name: evt.name,
              args: evt.args,
              output: '',
              status: 'running'
            }];
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  tool_calls: toolCalls.map(tc => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: { name: tc.name, arguments: JSON.stringify(tc.args) }
                  }))
                };
              }
              return next;
            });
            setStatusText(`Running ${evt.name}...`);
            break;
          }
          case 'tool_output': {
            toolCalls = toolCalls.map(tc =>
              tc.id === evt.id ? { ...tc, output: tc.output + (evt.output || evt.content || '') } : tc
            );
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant' && last.tool_calls) {
                // We don't store output in tool_calls; we store it in a parallel field.
                next[next.length - 1] = {
                  ...last,
                  // Use name field to stash the latest tool calls output map (encoded in tool_call_id)
                  // Actually keep it simpler: store tool outputs as separate UI state attached to last message
                  content: last.content,
                  tool_calls: last.tool_calls
                };
              }
              return next;
            });
            // We'll render tool output via a side channel — store in a ref keyed by message index
            // For simplicity, we attach outputs to the last message via a custom property
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1] as any;
              if (last && last.role === 'assistant') {
                if (!last._toolOutputs) last._toolOutputs = {};
                last._toolOutputs[evt.id] = toolCalls.find(tc => tc.id === evt.id)?.output || '';
              }
              return next;
            });
            break;
          }
          case 'tool_end': {
            toolCalls = toolCalls.map(tc =>
              tc.id === evt.id
                ? { ...tc, output: evt.output || tc.output, status: 'done' as const }
                : tc
            );
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1] as any;
              if (last && last.role === 'assistant') {
                if (!last._toolOutputs) last._toolOutputs = {};
                last._toolOutputs[evt.id] = toolCalls.find(tc => tc.id === evt.id)?.output || '';
                if (!last._toolStatus) last._toolStatus = {};
                last._toolStatus[evt.id] = 'done';
              }
              return next;
            });
            setStatusText('');
            break;
          }
          case 'plan_update':
            setPlan({
              explanation: evt.explanation,
              steps: evt.plan.map(s => ({ step: s.step, status: s.status }))
            });
            setStatusText('');
            break;
          case 'agent_spawned':
            setAgents(prev => [...prev, {
              agentId: evt.agent_id,
              nickname: evt.nickname,
              task: evt.task
            }]);
            break;
          case 'error':
            setStatusText('');
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'assistant') {
                next[next.length - 1] = {
                  ...last,
                  content: (last.content || '') + `\n\n**Error:** ${evt.content}`
                };
              }
              return next;
            });
            break;
          case 'cancelled':
            setStatusText('Cancelled');
            break;
          case 'done':
            setStatusText('');
            break;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatusText('Cancelled');
      } else {
        console.error('Chat stream error:', err);
        setStatusText('');
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = {
              ...last,
              content: (last.content || '') + `\n\n**Stream error:** ${err.message}`
            };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      // Refresh chats list to capture title updates and new chats
      await refreshChats();
    }
  };

  const handleToggleSkill = async (skillName: string) => {
    if (activeChatId == null) return;
    const next = activeSkills.includes(skillName)
      ? activeSkills.filter(s => s !== skillName)
      : [...activeSkills, skillName];
    setActiveSkills(next);
    try {
      await api.setChatSkill(activeChatId, skillName, !activeSkills.includes(skillName));
    } catch (err) {
      console.error('Failed to toggle skill:', err);
      setActiveSkills(activeSkills); // revert
    }
  };

  return (
    <div className="app-shell">
      <Header
        config={config}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenModelPicker={() => setShowModelPicker(true)}
        onOpenTerminal={() => setShowTerminal(true)}
        onOpenExplorer={() => setShowExplorer(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        workspacePath={config?.workspacePath || ''}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <main className="chat-main">
        {messages.length === 0 ? (
          <div className="messages-container">
            <div className="messages-inner">
              <div className="welcome-state">
                <div className="welcome-icon">
                  <Icon name="sparkles" size={32} />
                </div>
                <h1 className="welcome-title">Nebula Coder</h1>
                <p className="welcome-subtitle">
                  Seu agente de IA para programação. Edita arquivos, clona repositórios,
                  roda comandos e gerencia seu GitHub — tudo a partir de uma conversa.
                </p>
                <div className="welcome-prompts">
                  {SAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      className="welcome-prompt"
                      onClick={() => handleSend(p.title + ': ' + p.desc)}
                      disabled={streaming}
                    >
                      <div className="welcome-prompt-title">{p.title}</div>
                      <div className="welcome-prompt-desc">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            streaming={streaming}
            statusText={statusText}
            plan={plan}
            agents={agents}
          />
        )}

        {/* Persistent warning banner when AI is not configured */}
        {config && (!config.apiUrl || config.apiUrl.trim() === '' || !config.apiKey || config.apiKey === '0' || config.apiKey.trim() === '') && (
          <div style={{
            margin: '0 24px 8px',
            padding: '10px 14px',
            background: 'var(--status-error-soft)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            fontSize: 13
          }}>
            <Icon name="alert" size={16} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
              <strong style={{ color: 'var(--status-error)' }}>IA não configurada.</strong>{' '}
              O agente não vai responder até você preencher a API URL e API Key.
            </span>
            <button
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setShowSettings(true)}
            >
              Configurar
            </button>
          </div>
        )}

        <Composer
          streaming={streaming}
          activeSkills={activeSkills}
          onSend={handleSend}
          onCancel={handleCancel}
          onToggleSkill={handleToggleSkill}
          activeChatId={activeChatId}
        />
      </main>

      {showSettings && (
        <SettingsScreen
          config={config}
          onClose={() => setShowSettings(false)}
          onSaved={setConfig}
        />
      )}

      {showModelPicker && config && (
        <ModelPickerModal
          currentModel={config.model}
          provider={config.provider}
          onClose={() => setShowModelPicker(false)}
          onSelect={async (model, provider) => {
            try {
              const updated = await api.saveSettings({ model, provider });
              setConfig(updated);
            } catch (err) {
              console.error('Failed to save model:', err);
            }
          }}
        />
      )}

      {showExplorer && (
        <ExplorerModal
          workspacePath={config?.workspacePath || ''}
          onClose={() => setShowExplorer(false)}
        />
      )}

      {showTerminal && (
        <TerminalModal
          onClose={() => setShowTerminal(false)}
        />
      )}
    </div>
  );
}
