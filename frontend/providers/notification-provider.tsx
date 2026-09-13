'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type NoticeKind = 'success' | 'error' | 'warning' | 'info';
interface Notice { id: string; kind: NoticeKind; message: string; }
interface NotificationContextValue { notify(kind: NoticeKind, message: string): void; }
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = useCallback((kind: NoticeKind, message: string) => {
    const id = globalThis.crypto.randomUUID();
    setNotices((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 6_000);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return <NotificationContext.Provider value={value}>{children}<div aria-live="polite" aria-atomic="true">{notices.map((notice) => <p key={notice.id} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</p>)}</div></NotificationContext.Provider>;
}
export function useNotifications() { const value = useContext(NotificationContext); if (!value) throw new Error('useNotifications must be used inside NotificationProvider'); return value; }
