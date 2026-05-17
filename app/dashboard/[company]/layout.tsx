'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { getPayload, getStoredToken, hasPermission } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const company = params.company as string;

  useEffect(() => {
    if (!getStoredToken() || !hasPermission('dashboard:acessar')) {
      router.replace('/login');
      return;
    }
    const payload = getPayload();
    if (payload?.companySlug && payload.companySlug !== company) {
      router.replace(`/dashboard/${payload.companySlug}`);
    }
  }, [router, company]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-8 bg-muted/30">{children}</main>
    </div>
  );
}
