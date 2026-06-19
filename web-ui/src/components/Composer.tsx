import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { api } from '../api';
import type { Skill } from '../types';

interface ComposerProps {
  streaming: boolean;
  activeSkills: string[];
  activeChatId: number | null;
  onSend: (text: string) => void;
  onCancel: () => void;
  onToggleSkill: (name: string) => void;
}

export default function Composer({
  streaming,
  activeSkills,
  activeChatId,
  onSend,
  onCancel,
  onToggleSkill
}: ComposerProps) {
  const [text, setText] = useState('');
  const [showSkillsPicker, setShowSkillsPicker] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
  }, [text]);

  // Keyboard: Cmd/Ctrl+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || streaming) return;
    onSend(text);
    setText('');
  };

  const loadSkills = async () => {
    try {
      const skills = await api.listSkills();
      setAvailableSkills(skills);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  return (
    <div className="composer">
      <div className="composer-inner">
        {showSkillsPicker && availableSkills.length > 0 && (
          <div className="slash-popover" style={{ marginBottom: 8 }}>
            <div className="slash-section">Habilidades disponíveis</div>
            {availableSkills.map(skill => {
              const active = activeSkills.includes(skill.name);
              return (
                <div
                  key={skill.name}
                  className={`slash-option ${active ? 'active' : ''}`}
                  onClick={() => {
                    onToggleSkill(skill.name);
                  }}
                >
                  <div className="slash-option-icon">
                    <Icon name="wand" size={14} />
                  </div>
                  <div className="slash-option-content">
                    <div className="slash-option-title">{skill.name}</div>
                    <div className="slash-option-desc">{skill.description || 'Sem descrição'}</div>
                  </div>
                  {active && <Icon name="check" size={16} />}
                </div>
              );
            })}
            <div
              className="slash-option"
              onClick={() => setShowSkillsPicker(false)}
              style={{ justifyContent: 'center', color: 'var(--text-tertiary)' }}
            >
              Fechar
            </div>
          </div>
        )}

        {activeSkills.length > 0 && (
          <div className="composer-skills-row">
            {activeSkills.map(name => (
              <span key={name} className="skill-chip">
                <Icon name="wand" size={11} />
                {name}
                <button
                  onClick={() => activeChatId != null && onToggleSkill(name)}
                  title="Remover"
                >
                  <Icon name="x" size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Pergunte qualquer coisa, ou peça para editar arquivos, rodar comandos, criar repos..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming}
        />

        <div className="composer-actions">
          <div className="composer-tools">
            <button
              className={`composer-tool-btn ${showSkillsPicker ? 'active' : ''}`}
              onClick={() => setShowSkillsPicker(!showSkillsPicker)}
              title="Ativar habilidades"
            >
              <Icon name="wand" size={14} />
              Skills
            </button>
            <span className="composer-tool-btn" style={{ cursor: 'default' }}>
              <Icon name="info" size={12} />
              ⌘+Enter para enviar
            </span>
          </div>

          <div className="composer-send">
            {streaming ? (
              <button className="cancel-btn" onClick={onCancel} title="Cancelar">
                <Icon name="square" size={14} />
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!text.trim()}
                title="Enviar"
              >
                <Icon name="send" size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
