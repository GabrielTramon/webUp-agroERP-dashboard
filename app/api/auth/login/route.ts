import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt, isExpired } from '@/lib/jwt';
import { AUTH_COOKIE, COOKIE_MAX_AGE, getBackendUrl } from '@/lib/server-config';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const backendRes = await fetch(`${getBackendUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await backendRes.json().catch(() => ({}));

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const token = (data as { access_token?: string }).access_token;
  if (!token) {
    return NextResponse.json({ message: 'Resposta inválida do servidor' }, { status: 502 });
  }

  const payload = decodeJwt(token);
  if (!payload || isExpired(payload)) {
    return NextResponse.json({ message: 'Token inválido' }, { status: 502 });
  }

  const res = NextResponse.json({ user: payload });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
