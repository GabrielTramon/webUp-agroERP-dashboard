import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'auth_token';

function isExpired(token: string): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) return true;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    const { exp } = JSON.parse(json) as { exp?: number };
    if (!exp) return false;
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = token && !isExpired(token);

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', req.nextUrl.pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
