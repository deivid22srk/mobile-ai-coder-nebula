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
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await api.listModels();
        setModels(list);
      } catch (err: any) {
        setError(err.message);
        setModels([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeProvider]);

  const filtered = models.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">Selecionar modelo</span>
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

        <div className="model-picker-search">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar modelos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="model-list">
          {loading && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span className="spinner lg" />
              <span style={{ fontSize: 12 }}>Carregando modelos...</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--status-error)', fontSize: 12 }}>
              <Icon name="alert" size={20} style={{ marginBottom: 6 }} />
              <div>{error}</div>
              <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>Verifique as configurações de API.</div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
              {search ? 'Nenhum modelo encontrado' : 'Nenhum modelo disponível'}
            </div>
          )}

          {!loading && !error && filtered.map(m => (
            <div
              key={m}
              className={`model-item ${m === currentModel ? 'active' : ''}`}
              onClick={() => { onSelect(m, activeProvider); onClose(); }}
            >
              <Icon name="cpu" size={14} />
              <span className="model-item-name">{m}</span>
              {m === currentModel && <Icon name="check" size={14} className="model-item-check" />}
            </div>
          ))}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {filtered.length} modelo{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
