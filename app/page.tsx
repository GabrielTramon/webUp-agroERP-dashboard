'use client';

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
}
