import { useState } from 'react';
import { Icon } from './Icon';
import type { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: number | null;
  workspacePath: string;
  sidebarOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: number) => void;
  onDeleteChat: (id: number) => void;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return 'agora';
  if (min < 60) return `${min}min atrás`;
  if (hr < 24) return `${hr}h atrás`;
  if (day < 7) return `${day}d atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Sidebar({
  chats,
  activeChatId,
  workspacePath,
  sidebarOpen,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat
}: SidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = chats.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group by recency
  const now = new Date();
  const today: Chat[] = [];
  const week: Chat[] = [];
  const older: Chat[] = [];

  for (const c of filtered) {
    const d = new Date(c.createdAt);
    const diff = now.getTime() - d.getTime();
    const day = diff / (1000 * 60 * 60 * 24);
    if (day < 1) today.push(c);
    else if (day < 7) week.push(c);
    else older.push(c);
  }

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-new-chat" onClick={onNewChat}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="plus" size={16} />
              Novo chat
            </span>
            <span className="kbd">⌘N</span>
          </button>
        </div>

        <div className="sidebar-search">
          <div className="search-input">
            <Icon name="search" size={14} />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="chats-list">
          {filtered.length === 0 && (
            <div className="chats-section-label" style={{ textAlign: 'center', padding: '24px 8px' }}>
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </div>
          )}

          {today.length > 0 && (
            <>
              <div className="chats-section-label">Hoje</div>
              {today.map(c => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  active={c.id === activeChatId}
                  onSelect={() => onSelectChat(c.id)}
                  onDelete={() => onDeleteChat(c.id)}
                />
              ))}
            </>
          )}

          {week.length > 0 && (
            <>
              <div className="chats-section-label">Últimos 7 dias</div>
              {week.map(c => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  active={c.id === activeChatId}
                  onSelect={() => onSelectChat(c.id)}
                  onDelete={() => onDeleteChat(c.id)}
                />
              ))}
            </>
          )}

          {older.length > 0 && (
            <>
              <div className="chats-section-label">Mais antigos</div>
              {older.map(c => (
                <ChatItem
                  key={c.id}
                  chat={c}
                  active={c.id === activeChatId}
                  onSelect={() => onSelectChat(c.id)}
                  onDelete={() => onDeleteChat(c.id)}
                />
              ))}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="workspace-pill" title={workspacePath}>
            <span className="workspace-dot" />
            <span className="workspace-path">{workspacePath || './workspace'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function ChatItem({
  chat,
  active,
  onSelect,
  onDelete
}: {
  chat: Chat;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`chat-item ${active ? 'active' : ''}`} onClick={onSelect}>
      <div className="chat-item-icon">
        <Icon name="message" size={13} />
      </div>
      <div className="chat-item-main">
        <div className="chat-item-title">{chat.title}</div>
        <div className="chat-item-meta">{formatRelative(chat.createdAt)}</div>
      </div>
      <button
        className="chat-item-delete"
        onClick={e => {
          e.stopPropagation();
          if (confirm(`Excluir "${chat.title}"?`)) onDelete();
        }}
        title="Excluir"
      >
        <Icon name="trash" size={13} />
      </button>
    </div>
  );
}
