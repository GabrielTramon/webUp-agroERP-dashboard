'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { hasPermission as check, type TokenPayload } from './auth';

type AuthContextValue = {
  user: TokenPayload | null;
  setUser: (u: TokenPayload | null) => void;
  hasPermission: (permission: string) => boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: TokenPayload | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<TokenPayload | null>(initialUser);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { user: TokenPayload | null };
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        hasPermission: (p) => check(user, p),
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
