import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt, isExpired } from '@/lib/jwt';
import { AUTH_COOKIE } from '@/lib/server-config';

<<<<<<< HEAD
export default async function HomePage() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const payload = token ? decodeJwt(token) : null;
  const valid = payload && !isExpired(payload);

  if (!valid) redirect('/login');
  if (payload!.isSuperAdmin) redirect('/admin');
  redirect('/dashboard');
=======
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPayload, isSuperAdminUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const payload = getPayload();
    if (!payload) {
      router.replace('/login');
      return;
    }
    if (isSuperAdminUser()) {
      router.replace('/admin');
      return;
    }
    if (payload.companySlug) {
      router.replace(`/dashboard/${payload.companySlug}`);
      return;
    }
    router.replace('/login');
  }, [router]);

  return null;
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
}
