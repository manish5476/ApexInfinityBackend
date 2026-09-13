'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiClient } from '@/lib/api/client';
import { authApi } from '@/features/auth/auth-api';
import type { CurrentUser, LoginInput } from '@/types/auth/auth';

type AuthStatus = 'booting' | 'authenticated' | 'anonymous';
interface AuthContextValue { status: AuthStatus; user: CurrentUser | null; login(input: LoginInput): Promise<void>; logout(): Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useRef<string>();
  const client = useMemo(() => new ApiClient(() => token.current), []);
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [user, setUser] = useState<CurrentUser | null>(null);

  const restore = useCallback(async () => {
    try {
      const refreshed = await authApi.refresh(client);
      token.current = refreshed.token;
      setUser(await authApi.me(client));
      setStatus('authenticated');
    } catch { token.current = undefined; setUser(null); setStatus('anonymous'); }
  }, [client]);

  useEffect(() => { void restore(); }, [restore]);
  const login = useCallback(async (input: LoginInput) => {
    const result = await authApi.login(client, input);
    token.current = result.token;
    setUser(result.user);
    setStatus('authenticated');
  }, [client]);
  const logout = useCallback(async () => {
    try { await authApi.logout(client); } finally { token.current = undefined; setUser(null); setStatus('anonymous'); }
  }, [client]);
  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
