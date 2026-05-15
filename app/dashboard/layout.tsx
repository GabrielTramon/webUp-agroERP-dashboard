'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { getStoredToken, hasPermission } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredToken() || !hasPermission('dashboard:acessar')) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-8 bg-muted/30">{children}</main>
    </div>
  );
}
