import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { renderMarkdown } from '../markdown';
import type { Message, UIAgent, UIPlan, UIToolCall } from '../types';

interface MessageListProps {
  messages: Message[];
  streaming: boolean;
  statusText: string;
  plan: UIPlan | null;
  agents: UIAgent[];
}

export default function MessageList({
  messages,
  streaming,
  statusText,
  plan,
  agents
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, statusText]);

  return (
    <div className="messages-container" ref={containerRef}>
      <div className="messages-inner">
        {messages.map((msg, i) => (
          <MessageRow key={i} message={msg} />
        ))}

        {streaming && statusText && (
          <div className="status-bar" style={{ margin: '8px 0 0', padding: '6px 0', borderTop: 'none' }}>
            <span className="status-dot" />
            <span>{statusText}</span>
          </div>
        )}

        {plan && plan.steps.length > 0 && <PlanPanel plan={plan} />}

        {agents.length > 0 && (
          <div className="agents-bar" style={{ margin: '8px 0 0', padding: '6px 0', borderTop: 'none', background: 'transparent', border: 'none' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sub-agentes:</span>
            {agents.map(a => (
              <span key={a.agentId} className="agent-chip">
                <span className="agent-chip-dot" />
                {a.nickname}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isTool = message.role === 'tool';

  if (isTool) {
    // Tool messages from history are rendered inside the assistant message
    // via the tool_calls array. We skip rendering standalone tool rows here.
    return null;
  }

  const toolOutputs = (message as any)._toolOutputs || {};
  const toolStatus = (message as any)._toolStatus || {};

  return (
    <div className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`msg-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <Icon name="user" size={16} /> : <Icon name="sparkles" size={16} />}
      </div>
      <div className="msg-body">
        <div className="msg-role">
          {isUser ? 'Você' : 'Nebula'}
          {isUser && <span className="role-pill">user</span>}
          {isAssistant && <span className="role-pill">assistant</span>}
        </div>

        {message.reasoning_content && (
          <div className="reasoning-block">{message.reasoning_content}</div>
        )}

        {message.content && (
          <div
            className="msg-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {message.tool_calls && message.tool_calls.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {message.tool_calls.map((tc) => (
              <ToolCard
                key={tc.id}
                toolCall={{
                  id: tc.id,
                  name: tc.function.name,
                  args: safeParseArgs(tc.function.arguments),
                  output: toolOutputs[tc.id] || '',
                  status: (toolStatus[tc.id] as 'running' | 'done' | 'error') || 'running'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function safeParseArgs(args: string): any {
  try {
    return JSON.parse(args);
  } catch (_) {
    return args;
  }
}

function ToolCard({ toolCall }: { toolCall: UIToolCall }) {
  const [expanded, setExpanded] = useState(true);

  const iconFor = (name: string) => {
    switch (name) {
      case 'read_file': return 'file';
      case 'write_file': return 'save';
      case 'list_dir': return 'folder';
      case 'run_command': return 'terminal';
      case 'git_clone': return 'github';
      case 'github_get_user':
      case 'github_list_repos':
      case 'github_create_repo':
      case 'github_push_files': return 'github';
      case 'memory_save':
      case 'memory_search': return 'database';
      case 'skill_read': return 'book';
      case 'spawn_agent':
      case 'list_agents':
      case 'wait_agent': return 'bot';
      case 'update_plan': return 'check';
      default: return 'wrench';
    }
  };

  const argPreview = () => {
    if (!toolCall.args) return '';
    if (typeof toolCall.args === 'string') return toolCall.args;
    const a = toolCall.args;
    if (a.relative_path) return a.relative_path;
    if (a.path) return a.path;
    if (a.command) return a.command;
    if (a.repo_url) return a.repo_url;
    if (a.name) return a.name;
    return JSON.stringify(a).slice(0, 80);
  };

  return (
    <div className="tool-card">
      <div className="tool-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="tool-card-icon">
          <Icon name={iconFor(toolCall.name) as any} size={14} />
        </div>
        <div className="tool-card-name">{toolCall.name}</div>
        {argPreview() && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {argPreview()}
          </span>
        )}
        <span className={`tool-card-status ${toolCall.status}`}>
          {toolCall.status === 'running' && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
          {toolCall.status === 'done' && <Icon name="check" size={11} />}
          {toolCall.status === 'error' && <Icon name="alert" size={11} />}
          {toolCall.status === 'running' ? 'rodando' : toolCall.status === 'done' ? 'ok' : 'erro'}
        </span>
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
      </div>

      {expanded && (
        <>
          {toolCall.args && (
            <div className="tool-card-args">
              <strong style={{ color: 'var(--text-tertiary)' }}>args:</strong>{' '}
              {typeof toolCall.args === 'string'
                ? toolCall.args
                : JSON.stringify(toolCall.args, null, 2)}
            </div>
          )}
          {toolCall.output && (
            <div className="tool-card-output">{toolCall.output}</div>
          )}
        </>
      )}
    </div>
  );
}

function PlanPanel({ plan }: { plan: UIPlan }) {
  const [expanded, setExpanded] = useState(true);
  const completed = plan.steps.filter(s => s.status === 'completed').length;
  const total = plan.steps.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="plan-panel">
      <div className="plan-header" onClick={() => setExpanded(!expanded)}>
        <Icon name="check" size={16} style={{ color: 'var(--accent-violet)' }} />
        <div className="plan-header-title">
          Plano do agente
          <span className="plan-progress">{completed}/{total} concluídos</span>
        </div>
        <div className="plan-progress-bar">
          <div className="plan-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
      </div>
      {expanded && (
        <div className="plan-body">
          {plan.explanation && (
            <div style={{ padding: '6px 12px 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, borderBottom: '1px solid var(--border-default)', marginBottom: 4 }}>
              {plan.explanation}
            </div>
          )}
          {plan.steps.map((step, i) => (
            <div key={i} className={`plan-step ${step.status}`}>
              <div className="plan-step-icon">
                {step.status === 'completed' && <Icon name="check" size={10} />}
                {step.status === 'in_progress' && <span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />}
                {step.status === 'pending' && <Icon name="circle" size={8} />}
              </div>
              <span>{step.step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
