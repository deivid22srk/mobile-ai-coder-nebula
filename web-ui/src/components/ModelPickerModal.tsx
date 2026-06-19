import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { api } from '../api';
import type { Provider } from '../types';

interface ModelPickerProps {
  currentModel: string;
  provider: Provider;
  onClose: () => void;
  onSelect: (model: string, provider: Provider) => void;
}

interface ModelGroup {
  family: string;
  color: string;
  emoji: string;
  models: string[];
}

function classifyModel(id: string): { family: string; color: string; emoji: string } {
  const lower = id.toLowerCase();
  if (lower.startsWith('claude') || lower.includes('anthropic')) {
    return { family: 'Claude', color: '#d97757', emoji: 'C' };
  }
  if (lower.startsWith('gpt') || lower.includes('openai') || lower.includes('o1') || lower.includes('o3')) {
    return { family: 'OpenAI GPT', color: '#10a37f', emoji: 'G' };
  }
  if (lower.startsWith('gemini')) {
    return { family: 'Gemini', color: '#4285f4', emoji: 'G' };
  }
  if (lower.startsWith('qwen')) {
    return { family: 'Qwen', color: '#6e4bf2', emoji: 'Q' };
  }
  if (lower.startsWith('deepseek')) {
    return { family: 'DeepSeek', color: '#4d6bfe', emoji: 'D' };
  }
  if (lower.startsWith('grok')) {
    return { family: 'Grok', color: '#1d9bf0', emoji: 'X' };
  }
  if (lower.startsWith('glm')) {
    return { family: 'GLM', color: '#3b82f6', emoji: 'Z' };
  }
  if (lower.startsWith('kimi')) {
    return { family: 'Kimi', color: '#000000', emoji: 'K' };
  }
  if (lower.startsWith('minimax')) {
    return { family: 'MiniMax', color: '#ec4899', emoji: 'M' };
  }
  if (lower.startsWith('mimo')) {
    return { family: 'Mimo', color: '#f59e0b', emoji: 'M' };
  }
  if (lower.startsWith('nemotron')) {
    return { family: 'Nemotron', color: '#76b900', emoji: 'N' };
  }
  if (lower.includes('free')) {
    return { family: 'Gratuitos', color: '#10b981', emoji: '✓' };
  }
  return { family: 'Outros', color: '#6b7280', emoji: '?' };
}

function groupModels(models: string[]): ModelGroup[] {
  const groups: Record<string, ModelGroup> = {};
  for (const id of models) {
    const { family, color, emoji } = classifyModel(id);
    if (!groups[family]) {
      groups[family] = { family, color, emoji, models: [] };
    }
    groups[family].models.push(id);
  }
  return Object.values(groups).sort((a, b) => {
    // Sort by model count desc, then by name
    if (b.models.length !== a.models.length) return b.models.length - a.models.length;
    return a.family.localeCompare(b.family);
  });
}

export default function ModelPickerModal({
  currentModel,
  provider,
  onClose,
  onSelect
}: ModelPickerProps) {
  const [activeProvider, setActiveProvider] = useState<Provider>(provider);
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await api.listModels();
        setModels(data.models || []);
        setCached(!!data.cached);
        if (!data.success && data.errorCode) {
          setError({ code: data.errorCode, message: data.error });
        }
      } catch (err: any) {
        setError({ code: 'FATAL', message: err.message });
        setModels([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = models.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupModels(filtered);

  const errorContent = () => {
    if (!error) return null;
    let title = 'Erro ao carregar modelos';
    let hint = '';
    switch (error.code) {
      case 'NO_API_URL':
        title = 'API não configurada';
        hint = 'Preencha API URL e API Key nas Configurações, depois volte aqui.';
        break;
      case 'AUTH_FAILED':
        title = 'API Key inválida';
        hint = 'A API rejeitou sua chave. Verifique se digitou corretamente.';
        break;
      case 'NETWORK_ERROR':
        title = 'Falha de rede';
        hint = 'Não foi possível contatar o endpoint. Verifique a URL e sua conexão.';
        break;
      case 'HTTP_ERROR':
        title = 'Erro do servidor';
        hint = 'A API retornou um erro. Veja detalhes abaixo.';
        break;
    }
    return (
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, margin: '0 auto 12px',
          borderRadius: '50%',
          background: 'var(--status-error-soft)',
          color: 'var(--status-error)',
          display: 'grid', placeItems: 'center'
        }}>
          <Icon name="alert" size={24} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {title}
        </div>
        {hint && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>
            {hint}
          </div>
        )}
        <div style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          background: 'var(--bg-base)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          margin: '8px auto 0',
          maxWidth: 380,
          textAlign: 'left',
          wordBreak: 'break-word'
        }}>
          {error.message}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="cpu" size={16} />
            <span className="modal-title">Selecionar modelo</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="tabs" style={{ margin: '14px 20px' }}>
          <button
            className={`tab ${activeProvider === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveProvider('custom')}
          >
            Custom
          </button>
          <button
            className={`tab ${activeProvider === 'opencode-zen' ? 'active' : ''}`}
            onClick={() => setActiveProvider('opencode-zen')}
          >
            Opencode Zen
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span className="spinner lg" />
            <span style={{ fontSize: 12 }}>Carregando modelos...</span>
          </div>
        ) : error ? (
          errorContent()
        ) : (
          <>
            <div className="model-picker-search">
              <Icon name="search" size={14} />
              <input
                type="text"
                placeholder="Buscar modelos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ padding: 4, color: 'var(--text-muted)' }}
                  title="Limpar"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>

            <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>
                {filtered.length} modelo{filtered.length !== 1 ? 's' : ''}
                {groups.length > 1 && ` · ${groups.length} famílias`}
              </span>
              {cached && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={11} style={{ color: 'var(--status-success)' }} />
                  em cache
                </span>
              )}
            </div>

            <div className="model-list">
              {groups.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  {search ? 'Nenhum modelo encontrado para sua busca' : 'Nenhum modelo disponível'}
                </div>
              )}

              {groups.map(group => (
                <div key={group.family} style={{ marginBottom: 8 }}>
                  {groups.length > 1 && (
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      padding: '8px 12px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: group.color,
                        display: 'inline-grid', placeItems: 'center',
                        color: '#fff', fontSize: 9, fontWeight: 700
                      }}>{group.emoji}</span>
                      {group.family}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                        ({group.models.length})
                      </span>
                    </div>
                  )}
                  {group.models.map(m => (
                    <div
                      key={m}
                      className={`model-item ${m === currentModel ? 'active' : ''}`}
                      onClick={() => { onSelect(m, activeProvider); onClose(); }}
                    >
                      <Icon name="cpu" size={13} style={{ color: group.color }} />
                      <span className="model-item-name">{m}</span>
                      {m === currentModel && (
                        <Icon name="check" size={14} className="model-item-check" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {error ? `Provider: ${activeProvider}` : `${models.length} modelos disponíveis`}
          </span>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
