export const AUTH_COOKIE = 'auth_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getBackendUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('Missing API_URL (or NEXT_PUBLIC_API_URL) env var');
  return url.replace(/\/$/, '');
}
