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
  exp?: number;
  iat?: number;
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

function check(payload: TokenPayload | null, permission: string): boolean {
  if (!payload) return false;
  if (payload.isSuperAdmin) return true;
  if (payload.role === 'ADMIN') return true;
  return payload.permissions.includes(permission);
}

export function hasPermission(payload: TokenPayload | null, permission: string): boolean;
export function hasPermission(permission: string): boolean;
export function hasPermission(
  arg1: TokenPayload | null | string,
  arg2?: string,
): boolean {
  if (typeof arg1 === 'string') return check(getPayload(), arg1);
  return check(arg1, arg2 as string);
}

export function isAdmin(): boolean {
  return getPayload()?.role === 'ADMIN';
}

export function isSuperAdminUser(): boolean {
  return getPayload()?.isSuperAdmin === true;
}
