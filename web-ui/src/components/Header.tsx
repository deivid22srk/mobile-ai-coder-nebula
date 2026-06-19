import { Icon } from './Icon';
import type { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig | null;
  onOpenSidebar: () => void;
  onOpenModelPicker: () => void;
  onOpenTerminal: () => void;
  onOpenExplorer: () => void;
  onOpenSettings: () => void;
}

export default function Header({
  config,
  onOpenSidebar,
  onOpenModelPicker,
  onOpenTerminal,
  onOpenExplorer,
  onOpenSettings
}: HeaderProps) {
  const isConfigured = Boolean(
    config &&
    (
      config.provider === 'opencode-zen'
        ? config.opencodeZenApiKey && config.opencodeZenApiKey.trim()
        : config.apiUrl && config.apiUrl.trim() && config.apiKey && config.apiKey !== '0'
    )
  );

  const providerLabel = config?.provider === 'opencode-zen' ? 'Zen' : 'Custom';
  const providerClass = config?.provider === 'opencode-zen' ? '' : 'custom';

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="icon-btn"
          onClick={onOpenSidebar}
          title="Mostrar histórico"
          aria-label="Mostrar histórico"
          style={{ display: 'none' }}
          id="btn-mobile-menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="logo">
          <div className="logo-mark">
            <Icon name="sparkles" size={16} strokeWidth={2.5} />
          </div>
          <span className="logo-text">Nebula Coder</span>
          <span className="logo-badge">v1.0</span>
        </div>
      </div>

      <div className="header-center">
        <button
          className={`model-trigger ${isConfigured ? '' : 'unconfigured'}`}
          onClick={onOpenModelPicker}
          title={isConfigured ? 'Selecionar modelo' : 'IA não configurada — clique para configurar'}
        >
          <span className="model-dot" />
          <span className="model-name">
            {config?.model || 'Selecionar modelo'}
          </span>
          <span className={`provider-badge ${providerClass}`}>{providerLabel}</span>
          <Icon name="chevron-down" size={14} />
        </button>
      </div>

      <div className="header-right">
        <button
          className="icon-btn"
          onClick={onOpenTerminal}
          title="Terminal manual"
          aria-label="Terminal"
        >
          <Icon name="terminal" size={18} />
        </button>
        <button
          className="icon-btn"
          onClick={onOpenExplorer}
          title="Arquivos do workspace"
          aria-label="Arquivos"
        >
          <Icon name="files" size={18} />
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Configurações"
          aria-label="Configurações"
        >
          <Icon name="settings" size={18} />
          {!isConfigured && <span className="badge" style={{ background: 'var(--status-warning)', boxShadow: '0 0 6px var(--status-warning)' }} />}
        </button>
      </div>

      <style>{`
        @media (max-width: 860px) {
          #btn-mobile-menu { display: grid !important; }
          .logo-text, .logo-badge { display: none; }
        }
      `}</style>
    </header>
  );
}
