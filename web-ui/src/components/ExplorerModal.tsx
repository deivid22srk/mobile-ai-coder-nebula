import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { api } from '../api';
import type { FileNode } from '../types';

interface ExplorerProps {
  workspacePath: string;
  onClose: () => void;
}

export default function ExplorerModal({ workspacePath, onClose }: ExplorerProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await api.listFiles();
      setTree(data.files);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFiles(); }, []);

  const handleSelectFile = async (path: string) => {
    if (dirty && !confirm('Descartar alterações não salvas?')) return;
    setSelectedPath(path);
    setDirty(false);
    try {
      const data = await api.viewFile(path);
      setContent(data.content);
    } catch (err: any) {
      setContent(`Erro ao ler arquivo: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      await api.writeFile(selectedPath, content);
      setDirty(false);
    } catch (err: any) {
      alert('Falha ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card full" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="files" size={16} />
            <span className="modal-title">Gerenciador de Arquivos</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{workspacePath}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="mini-btn" onClick={loadFiles} title="Atualizar">
              <Icon name="refresh" size={13} />
              Atualizar
            </button>
            <button className="modal-close" onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        <div className="explorer-grid">
          <div className="explorer-tree">
            {loading ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                <span className="spinner" style={{ marginRight: 6 }} />
                Carregando...
              </div>
            ) : tree.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                Workspace vazio
              </div>
            ) : (
              tree.map((node, i) => (
                <TreeNode
                  key={i}
                  node={node}
                  depth={0}
                  selectedPath={selectedPath}
                  onSelect={handleSelectFile}
                />
              ))
            )}
          </div>

          <div className="explorer-editor">
            <div className="explorer-editor-header">
              <span>{selectedPath || 'Nenhum arquivo selecionado'}</span>
              {selectedPath && (
                <button
                  className="mini-btn primary"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                >
                  <Icon name="save" size={13} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              )}
            </div>
            <textarea
              className="explorer-editor-textarea"
              value={content}
              onChange={e => { setContent(e.target.value); setDirty(true); }}
              placeholder="Selecione um arquivo na árvore à esquerda para visualizá-lo ou editá-lo aqui."
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect
}: {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.isDirectory) {
    return (
      <div>
        <div
          className="tree-node"
          style={{ paddingLeft: 8 + depth * 12 }}
          onClick={() => setExpanded(!expanded)}
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={12} />
          <Icon name={expanded ? 'folder-open' : 'folder'} size={14} style={{ color: 'var(--accent-violet)' }} />
          <span>{node.name}</span>
          {node.children && node.children.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
              {node.children.length}
            </span>
          )}
        </div>
        {expanded && node.children && (
          <div className="tree-children">
            {node.children.map((child, i) => (
              <TreeNode
                key={i}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`tree-node ${selectedPath === node.relativePath ? 'active' : ''}`}
      style={{ paddingLeft: 8 + depth * 12 + 16 }}
      onClick={() => onSelect(node.relativePath)}
    >
      <Icon name="file" size={13} />
      <span>{node.name}</span>
      {node.size != null && node.size > 0 && (
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
          {formatSize(node.size)}
        </span>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
