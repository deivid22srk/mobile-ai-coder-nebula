import { useState } from 'react';
import { Icon } from './Icon';
import { api } from '../api';

interface TerminalProps {
  onClose: () => void;
}

export default function TerminalModal({ onClose }: TerminalProps) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('Saída do terminal aparecerá aqui...');
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (!command.trim() || running) return;
    setRunning(true);
    setOutput(`$ ${command}\n`);
    try {
      const data = await api.runTerminal(command);
      setOutput(`$ ${command}\n${data.output}`);
    } catch (err: any) {
      setOutput(`$ ${command}\nErro: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRun();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="terminal" size={16} />
            <span className="modal-title">Terminal do Workspace</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Comando bash</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
              <Icon name="chevron-right" size={14} style={{ color: 'var(--accent-violet)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="npm run build, git status, ls -la..."
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1, background: 'none', border: 'none', padding: 0 }}
                spellCheck={false}
              />
              <button className="btn-primary" onClick={handleRun} disabled={running || !command.trim()}>
                {running ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Icon name="play" size={13} />}
                {running ? 'Rodando' : 'Executar'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Saída</label>
            <div className="terminal-output">{output}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
