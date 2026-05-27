'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Building2, Users } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarSection } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { useAuth } from '@/lib/auth-context';

const sections: SidebarSection[] = [
  {
    label: 'Administração',
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { title: 'Empresas',  href: '/admin/companies', icon: Building2 },
      { title: 'Usuários',  href: '/admin/users',     icon: Users },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <SidebarProvider>
      <AppSidebar sections={sections} />
      <SidebarInset>
        <DashboardHeader
          userName={user?.name ?? ''}
          userSubtitle={user?.email ?? 'Super Admin'}
        />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
