import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, getBackendUrl } from '@/lib/server-config';

const HOP_BY_HOP = new Set([
  'transfer-encoding',
  'connection',
  'keep-alive',
  'content-encoding',
  'content-length',
]);

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;

  const url = `${getBackendUrl()}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
  });

  const respHeaders = new Headers();
  backendRes.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) respHeaders.set(k, v);
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: respHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
