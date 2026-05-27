import type { TokenPayload } from './auth';

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf-8');
  }
  return atob(padded);
}

export function decodeJwt(token: string): TokenPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(base64UrlDecode(part)) as TokenPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: { exp?: number } | null): boolean {
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
}
