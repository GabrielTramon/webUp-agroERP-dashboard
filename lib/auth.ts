export type TokenPayload = {
  sub: string;
  name: string;
  email: string;
  role?: string;
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  isSuperAdmin: boolean;
  permissions: string[];
};

export function parseToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getPayload(): TokenPayload | null {
  const token = getStoredToken();
  if (!token) return null;
  return parseToken(token);
}

export function hasPermission(permission: string): boolean {
  const payload = getPayload();
  if (!payload) return false;
  if (payload.isSuperAdmin) return true;
  if (payload.role === 'ADMIN') return true;
  return payload.permissions.includes(permission);
}

export function isAdmin(): boolean {
  return getPayload()?.role === 'ADMIN';
}

export function isSuperAdminUser(): boolean {
  return getPayload()?.isSuperAdmin === true;
}
