'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import styles from './app-shell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return <div className={styles.shell}><aside className={styles.sidebar}><Link href="/dashboard" className={styles.brand}>Apex Infinity</Link><nav aria-label="Primary navigation"><Link href="/dashboard">Overview</Link></nav></aside><header className={styles.header}><span>{user?.name}</span><Button onClick={() => void logout()}>Sign out</Button></header><main className={styles.main}>{children}</main></div>;
}
