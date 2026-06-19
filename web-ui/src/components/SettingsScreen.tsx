import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { api } from '../api';
import type { AppConfig, GitHubStatus, Memory, Skill } from '../types';

type Category = 'llm' | 'memory' | 'skills' | 'github' | 'general' | 'tools';

interface SettingsProps {
  config: AppConfig | null;
  onClose: () => void;
  onSaved: (cfg: AppConfig) => void;
}

const NAV_ITEMS: { id: Category; label: string; icon: any }[] = [
  { id: 'llm', label: 'LLM & Provider', icon: 'cpu' },
  { id: 'memory', label: 'Memória', icon: 'database' },
  { id: 'skills', label: 'Habilidades', icon: 'wand' },
  { id: 'github', label: 'GitHub', icon: 'github' },
  { id: 'general', label: 'Workspace', icon: 'folder' },
  { id: 'tools', label: 'System Prompt', icon: 'sliders' }
];

export default function SettingsScreen({ config, onClose, onSaved }: SettingsProps) {
  const [category, setCategory] = useState<Category>('llm');
  const [draft, setDraft] = useState<AppConfig | null>(config);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Test API connection
  const [testStatus, setTestStatus] = useState<{ kind: 'success' | 'error' | 'loading'; text: string } | null>(null);

  // GitHub state
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [githubMsg, setGithubMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Skills / Memories
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Create skill / memory modals
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [showCreateMemory, setShowCreateMemory] = useState(false);
  const [showImportSkill, setShowImportSkill] = useState(false);

  useEffect(() => {
    if (category === 'github') loadGithubStatus();
    if (category === 'skills') loadSkills();
    if (category === 'memory') loadMemories();
  }, [category]);

  const loadGithubStatus = async () => {
    try {
      setGithubStatus(await api.getGitHubStatus());
    } catch (err) {
      console.error('Failed to load GitHub status:', err);
    }
  };

  const loadSkills = async () => {
    try {
      setSkills(await api.listSkills());
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const loadMemories = async () => {
    try {
      setMemories(await api.listMemories('global'));
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api.saveSettings(draft);
      onSaved(updated);
      setSaveStatus({ kind: 'success', text: 'Configurações salvas com sucesso' });
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err: any) {
      setSaveStatus({ kind: 'error', text: err.message || 'Falha ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!draft) return;
    setTestStatus({ kind: 'loading', text: 'Testando...' });
    try {
      // Save settings first so backend uses the latest credentials
      await api.saveSettings(draft);
      const models = await api.listModels();
      if (models.length > 0) {
        setTestStatus({ kind: 'success', text: `Conexão OK — ${models.length} modelos disponíveis` });
      } else {
        setTestStatus({ kind: 'error', text: 'Conexão OK mas nenhum modelo retornado' });
      }
    } catch (err: any) {
      setTestStatus({ kind: 'error', text: err.message || 'Falha na conexão' });
    }
  };

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) {
      setGithubMsg({ kind: 'error', text: 'Token é obrigatório' });
      return;
    }
    try {
      await api.connectGitHub(githubToken);
      await loadGithubStatus();
      // Persist token in config too
      if (draft) {
        const updated = await api.saveSettings({ githubToken });
        onSaved(updated);
        setDraft(updated);
      }
      setGithubToken('');
      setGithubMsg({ kind: 'success', text: 'GitHub conectado' });
      setTimeout(() => setGithubMsg(null), 2500);
    } catch (err: any) {
      setGithubMsg({ kind: 'error', text: err.message || 'Falha ao conectar' });
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await api.disconnectGitHub();
      await loadGithubStatus();
      setGithubMsg({ kind: 'success', text: 'GitHub desconectado' });
      setTimeout(() => setGithubMsg(null), 2500);
    } catch (err: any) {
      setGithubMsg({ kind: 'error', text: err.message });
    }
  };

  if (!draft) return null;

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="icon-btn" onClick={onClose} title="Voltar">
            <Icon name="arrow-left" size={18} />
          </button>
          <div>
            <div className="settings-title">Configurações</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Gerencie provedor de LLM, memória, habilidades e integrações
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveStatus && (
            <span className={`settings-status ${saveStatus.kind}`}>{saveStatus.text}</span>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Icon name="save" size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="settings-body">
        {/* Desktop sidebar nav */}
        <nav className="settings-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`settings-nav-item ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile horizontal tab strip (CSS shows it only ≤860px) */}
        <div className="settings-nav-tabs">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`settings-nav-tab ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              <Icon name={item.icon} size={13} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* LLM */}
          {category === 'llm' && (
            <div>
              <SectionHeader
                eyebrow="Conexão"
                title="Provedor de API"
                desc="Aponte o agente para qualquer endpoint compatível com OpenAI."
              />

              {/* Warning banner when API is not configured */}
              {(!draft.apiUrl || draft.apiUrl.trim() === '' || !draft.apiKey || draft.apiKey === '0' || draft.apiKey.trim() === '') && (
                <div style={{
                  marginBottom: 16,
                  padding: '14px 16px',
                  background: 'var(--status-error-soft)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}>
                  <div style={{ color: 'var(--status-error)', flexShrink: 0, marginTop: 1 }}>
                    <Icon name="alert" size={18} />
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--status-error)', display: 'block', marginBottom: 2 }}>
                      IA não está configurada
                    </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Preencha <strong>API URL</strong> e <strong>API Key</strong> abaixo e clique em <strong>Salvar</strong>.
                      Sem isso, o agente retorna erro quando você envia qualquer mensagem.
                      {!draft.apiUrl || draft.apiUrl.trim() === ''
                        ? ' (API URL está vazia)'
                        : ' (API Key está vazia ou é "0")'}
                    </span>
                  </div>
                </div>
              )}

              <div className="settings-card">
                <div className="form-group">
                  <label className="form-label">Provider</label>
                  <select
                    className="form-select"
                    value={draft.provider}
                    onChange={e => setDraft({ ...draft, provider: e.target.value as any })}
                  >
                    <option value="custom">Custom OpenAI-compatible</option>
                    <option value="opencode-zen">Opencode Zen</option>
                  </select>
                </div>

                {draft.provider === 'custom' && (
                  <div className="form-group">
                    <label className="form-label">API URL</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://api.openai.com/v1"
                      value={draft.apiUrl}
                      onChange={e => setDraft({ ...draft, apiUrl: e.target.value })}
                    />
                    <span className="field-help">Endpoint base do servidor (sem <code>/chat/completions</code>).</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    {draft.provider === 'opencode-zen' ? 'Opencode Zen API Key' : 'API Key'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="sk-..."
                    value={draft.provider === 'opencode-zen' ? draft.opencodeZenApiKey : draft.apiKey}
                    onChange={e =>
                      draft.provider === 'opencode-zen'
                        ? setDraft({ ...draft, opencodeZenApiKey: e.target.value })
                        : setDraft({ ...draft, apiKey: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="qwen-plus"
                    value={draft.model}
                    onChange={e => setDraft({ ...draft, model: e.target.value })}
                  />
                  <span className="field-help">Use o seletor de modelo na barra superior para ver a lista completa.</span>
                </div>

                <div className="settings-action-row">
                  <button className="btn-secondary" onClick={handleTestConnection}>
                    <Icon name="play" size={13} />
                    Testar conexão
                  </button>
                  {testStatus && (
                    <span className={`settings-status ${testStatus.kind === 'success' ? 'success' : testStatus.kind === 'error' ? 'error' : ''}`}>
                      {testStatus.kind === 'loading' && <span className="spinner" style={{ width: 11, height: 11, marginRight: 4 }} />}
                      {testStatus.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Memory */}
          {category === 'memory' && (
            <div>
              <SectionHeader
                eyebrow="Persistência"
                title="Memória"
                desc="O agente salva e recupera memórias persistentes entre sessões. Memórias globais são injetadas em toda conversa."
              />
              <div className="settings-card">
                <div className="toolbar">
                  <button className="mini-btn primary" onClick={() => setShowCreateMemory(true)}>
                    <Icon name="plus" size={13} />
                    Nova memória
                  </button>
                  <button className="mini-btn" onClick={loadMemories}>
                    <Icon name="refresh" size={13} />
                    Atualizar
                  </button>
                </div>

                {memories.length === 0 ? (
                  <div className="list-empty">Nenhuma memória ainda. Crie uma para o agente lembrar entre sessões.</div>
                ) : (
                  memories.map(m => (
                    <div key={m.id} className="list-item">
                      <div className="list-item-icon"><Icon name="database" size={15} /></div>
                      <div className="list-item-main">
                        <div className="list-item-title">
                          {m.name}
                          <span className="tool-card-status" style={{ fontSize: 10 }}>{m.type}</span>
                          <span className="tool-card-status" style={{ fontSize: 10 }}>{m.scope}</span>
                        </div>
                        <div className="list-item-desc">{m.content}</div>
                      </div>
                      <div className="list-item-actions">
                        <button
                          className="icon-btn"
                          onClick={async () => {
                            try { await api.deleteMemory(m.id); await loadMemories(); } catch (_) {}
                          }}
                          title="Excluir"
                          style={{ width: 28, height: 28 }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {category === 'skills' && (
            <div>
              <SectionHeader
                eyebrow="Capacidades"
                title="Habilidades"
                desc="Ative habilidades para dar ao agente instruções especializadas. Carregadas de .mobile-ai-coder/skills/."
              />
              <div className="settings-card">
                <div className="toolbar">
                  <button className="mini-btn primary" onClick={() => setShowCreateSkill(true)}>
                    <Icon name="plus" size={13} />
                    Nova habilidade
                  </button>
                  <button className="mini-btn" onClick={() => setShowImportSkill(true)}>
                    <Icon name="download" size={13} />
                    Importar URL
                  </button>
                  <button className="mini-btn" onClick={loadSkills}>
                    <Icon name="refresh" size={13} />
                    Atualizar
                  </button>
                </div>

                {skills.length === 0 ? (
                  <div className="list-empty">Nenhuma habilidade instalada.</div>
                ) : (
                  skills.map(s => (
                    <div key={s.name} className="list-item">
                      <div className="list-item-icon"><Icon name="wand" size={15} /></div>
                      <div className="list-item-main">
                        <div className="list-item-title">{s.name}</div>
                        <div className="list-item-desc">{s.description || 'Sem descrição'}</div>
                      </div>
                      <div className="list-item-actions">
                        <button
                          className="icon-btn"
                          onClick={async () => {
                            if (confirm(`Excluir habilidade "${s.name}"?`)) {
                              try { await api.deleteSkill(s.name); await loadSkills(); } catch (_) {}
                            }
                          }}
                          title="Excluir"
                          style={{ width: 28, height: 28 }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* GitHub */}
          {category === 'github' && (
            <div>
              <SectionHeader
                eyebrow="Conta"
                title="Integração com GitHub"
                desc="Conecte sua conta GitHub para o agente criar repositórios e enviar código em seu nome."
              />
              <div className="settings-card">
                <div className="github-status">
                  {githubStatus?.user?.avatarUrl ? (
                    <img
                      src={githubStatus.user.avatarUrl}
                      className="github-avatar"
                      alt="avatar"
                    />
                  ) : (
                    <div className="github-avatar" style={{ display: 'grid', placeItems: 'center' }}>
                      <Icon name="github" size={20} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`github-dot ${githubStatus?.connected ? 'connected' : ''}`} />
                      <strong>{githubStatus?.connected ? (githubStatus.user?.name || githubStatus.user?.login) : 'Não conectado'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {githubStatus?.connected
                        ? `Conectado como @${githubStatus.user?.login} · ${githubStatus.tokenPreview}`
                        : 'Adicione um Personal Access Token abaixo para habilitar as ferramentas GitHub do agente.'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Access Token</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="ghp_... ou github_pat_..."
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                  />
                  <span className="field-help">
                    Crie em{' '}
                    <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">
                      github.com/settings/tokens
                    </a>
                    . Scopes necessários: <code>repo</code>.
                  </span>
                </div>

                <div className="settings-action-row">
                  {!githubStatus?.connected ? (
                    <button className="btn-primary" onClick={handleConnectGithub}>
                      <Icon name="github" size={14} />
                      Conectar GitHub
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={handleDisconnectGithub}>
                      Desconectar
                    </button>
                  )}
                  {githubMsg && (
                    <span className={`settings-status ${githubMsg.kind === 'success' ? 'success' : 'error'}`}>
                      {githubMsg.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* General / Workspace */}
          {category === 'general' && (
            <div>
              <SectionHeader
                eyebrow="Arquivos"
                title="Workspace"
                desc="A pasta em disco que o agente pode ler e modificar."
              />
              <div className="settings-card">
                <div className="form-group">
                  <label className="form-label">Caminho do Workspace</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/absolute/path/to/workspace"
                    value={draft.workspacePath}
                    onChange={e => setDraft({ ...draft, workspacePath: e.target.value })}
                  />
                  <span className="field-help">
                    Garanta que o processo backend tem permissões de leitura/escrita para este caminho.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tools / System Prompt */}
          {category === 'tools' && (
            <div>
              <SectionHeader
                eyebrow="Comportamento"
                title="Instruções de Sistema"
                desc="Diga ao agente como se comportar a cada turno."
              />
              <div className="settings-card">
                <div className="form-group">
                  <label className="form-label">System Prompt</label>
                  <textarea
                    className="form-textarea"
                    rows={14}
                    placeholder="Instruções detalhadas do system prompt..."
                    value={draft.systemPrompt}
                    onChange={e => setDraft({ ...draft, systemPrompt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateSkill && (
        <CreateSkillModal
          onClose={() => setShowCreateSkill(false)}
          onCreated={async () => { setShowCreateSkill(false); await loadSkills(); }}
        />
      )}

      {showCreateMemory && (
        <CreateMemoryModal
          onClose={() => setShowCreateMemory(false)}
          onCreated={async () => { setShowCreateMemory(false); await loadMemories(); }}
        />
      )}

      {showImportSkill && (
        <ImportSkillModal
          onClose={() => setShowImportSkill(false)}
          onImported={async () => { setShowImportSkill(false); await loadSkills(); }}
        />
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="settings-section-header">
      <div className="settings-eyebrow">{eyebrow}</div>
      <h2 className="settings-section-title">{title}</h2>
      <p className="settings-section-desc">{desc}</p>
    </div>
  );
}

function CreateSkillModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const handleCreate = async () => {
    if (!name || !content) {
      setStatus({ kind: 'error', text: 'Nome e conteúdo são obrigatórios' });
      return;
    }
    try {
      await api.createSkill(name, desc, content);
      setStatus({ kind: 'success', text: 'Habilidade criada' });
      setTimeout(onCreated, 600);
    } catch (err: any) {
      setStatus({ kind: 'error', text: err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nova habilidade</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input type="text" className="form-input" placeholder="ex: code-review" value={name} onChange={e => setName(e.target.value)} />
            <span className="field-help">Lowercase, hifens apenas. Vira o nome da pasta.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input type="text" className="form-input" placeholder="O que esta habilidade faz e quando ativar" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Instruções (Markdown)</label>
            <textarea className="form-textarea" rows={10} placeholder="# Skill: My Skill..." value={content} onChange={e => setContent(e.target.value)} />
          </div>
          {status && <div className={`settings-status ${status.kind}`} style={{ marginTop: 8 }}>{status.text}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleCreate}>
            <Icon name="plus" size={14} />
            Criar habilidade
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateMemoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('fact');
  const [scope, setScope] = useState('global');
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (!name || !content) {
      setStatus({ kind: 'error', text: 'Nome e conteúdo são obrigatórios' });
      return;
    }
    try {
      await api.saveMemory({ name, content, type, scope });
      setStatus({ kind: 'success', text: 'Memória salva' });
      setTimeout(onCreated, 600);
    } catch (err: any) {
      setStatus({ kind: 'error', text: err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nova memória</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input type="text" className="form-input" placeholder="ex: user-preferred-framework" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Conteúdo</label>
            <textarea className="form-textarea" rows={6} placeholder="O que o agente deve lembrar..." value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="fact">Fato</option>
              <option value="preference">Preferência</option>
              <option value="identity">Identidade</option>
              <option value="project">Projeto</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Escopo</label>
            <select className="form-select" value={scope} onChange={e => setScope(e.target.value)}>
              <option value="global">Global (todos os chats)</option>
              <option value="chat">Chat (esta conversa)</option>
            </select>
          </div>
          {status && <div className={`settings-status ${status.kind}`} style={{ marginTop: 8 }}>{status.text}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>
            <Icon name="save" size={14} />
            Salvar memória
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportSkillModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<{ kind: 'success' | 'error' | 'loading'; text: string } | null>(null);

  const handleImport = async () => {
    if (!url) {
      setStatus({ kind: 'error', text: 'URL é obrigatória' });
      return;
    }
    setStatus({ kind: 'loading', text: 'Importando...' });
    try {
      await api.importSkillFromUrl(url);
      setStatus({ kind: 'success', text: 'Habilidade importada' });
      setTimeout(onImported, 600);
    } catch (err: any) {
      setStatus({ kind: 'error', text: err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">Importar habilidade</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">URL</label>
            <input type="text" className="form-input" placeholder="https://example.com/skills/my-skill/SKILL.md" value={url} onChange={e => setUrl(e.target.value)} />
            <span className="field-help">Cole uma URL para um arquivo SKILL.md ou um index.json (formato opencode).</span>
          </div>
          {status && <div className={`settings-status ${status.kind === 'success' ? 'success' : status.kind === 'error' ? 'error' : ''}`} style={{ marginTop: 8 }}>{status.text}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleImport}>
            <Icon name="download" size={14} />
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
