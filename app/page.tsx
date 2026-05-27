import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt, isExpired } from '@/lib/jwt';
import { AUTH_COOKIE } from '@/lib/server-config';

export default async function HomePage() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const payload = token ? decodeJwt(token) : null;
  const valid = payload && !isExpired(payload);

  if (!valid) redirect('/login');
  if (payload!.isSuperAdmin) redirect('/admin');
  redirect('/dashboard');
}
