import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decodeJwt, isExpired } from '@/lib/jwt';
import { AUTH_COOKIE } from '@/lib/server-config';

export async function GET() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const payload = decodeJwt(token);
  if (!payload || isExpired(payload)) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  return NextResponse.json({ user: payload });
}
