import { useEffect, useState } from 'react';
import { Icon, type IconName } from './Icon';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

let nextId = 1;

const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

export function toast(kind: ToastKind, title: string, message?: string, duration = 4000) {
  const item: ToastItem = { id: nextId++, kind, title, message, duration };
  items = [...items, item];
  listeners.forEach(fn => fn(items));

  if (duration > 0) {
    setTimeout(() => {
      items = items.filter(i => i.id !== item.id);
      listeners.forEach(fn => fn(items));
    }, duration);
  }
}

export function dismissToast(id: number) {
  items = items.filter(i => i.id !== id);
  listeners.forEach(fn => fn(items));
}

const ICONS: Record<ToastKind, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info'
};

export function ToastContainer() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const fn = (items: ToastItem[]) => setList(items);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="toast-container">
      {list.map(t => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <div className="toast-icon">
            <Icon name={ICONS[t.kind]} size={13} />
          </div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
          <button
            className="icon-btn"
            style={{ width: 22, height: 22 }}
            onClick={() => dismissToast(t.id)}
          >
            <Icon name="x" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
