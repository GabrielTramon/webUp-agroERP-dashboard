'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Building2, Users } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarSection } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { useAuth } from '@/lib/auth-context';

<<<<<<< HEAD
const sections: SidebarSection[] = [
  {
    label: 'Administração',
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { title: 'Empresas',  href: '/admin/companies', icon: Building2 },
      { title: 'Usuários',  href: '/admin/users',     icon: Users },
    ],
  },
=======
const navItems = [
  { title: 'Início',   href: '/admin',           icon: LayoutGrid, exact: true  },
  { title: 'Empresas', href: '/admin/companies', icon: Building2,  exact: false },
  { title: 'Usuários', href: '/admin/users',     icon: Users,      exact: false },
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
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
<<<<<<< HEAD
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
=======
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r bg-background flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Super Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                (item.exact ? pathname === item.href : pathname.startsWith(item.href)) && 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="border-t px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{name}</span>
            <span className="text-xs text-muted-foreground">Super Admin</span>
          </div>
          <button onClick={handleLogout} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-muted/30">{children}</main>
    </div>
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
  );
}
