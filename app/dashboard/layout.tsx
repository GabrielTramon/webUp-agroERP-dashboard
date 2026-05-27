'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCircle,
  Shield,
  KeyRound,
  LayoutDashboard,
  ShoppingBasket,
  TrendingUp,
  Landmark,
  BarChart2,
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarSection } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { useAuth } from '@/lib/auth-context';

const moduleItems = [
  { title: 'Dashboard',  href: '/dashboard',                 icon: LayoutDashboard, permission: 'dashboard:acessar' },
  { title: 'Clientes',   href: '/dashboard/clients',         icon: UserCircle,      permission: 'clientes:visualizar' },
  { title: 'Produtos',   href: '/dashboard/products',        icon: ShoppingBasket,  permission: 'produtos:visualizar' },
  { title: 'Vendas',     href: '/dashboard/sales',           icon: TrendingUp,      permission: 'vendas:visualizar' },
  { title: 'Caixa',      href: '/dashboard/cash-register',   icon: Landmark,        permission: 'caixa:visualizar' },
  { title: 'Financeiro', href: '/dashboard/financial',       icon: BarChart2,       permission: 'financeiro:visualizar' },
];

const adminItems = [
  { title: 'Usuários',   href: '/dashboard/users',       icon: Users,    permission: 'usuarios:visualizar' },
  { title: 'Perfis',     href: '/dashboard/roles',       icon: Shield,   permission: 'perfis:visualizar' },
  { title: 'Permissões', href: '/dashboard/permissions', icon: KeyRound, permission: 'perfis:visualizar' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (user && !hasPermission('dashboard:acessar')) {
      router.replace('/login');
    }
  }, [user, hasPermission, router]);

  const sections = useMemo<SidebarSection[]>(() => {
    if (!user) return [];
    const modules = moduleItems.filter((i) => hasPermission(i.permission));
    const admin = adminItems.filter((i) => hasPermission(i.permission));
    const out: SidebarSection[] = [];
    if (modules.length) out.push({ label: 'Módulos', items: modules });
    if (admin.length) out.push({ label: 'Administração', items: admin });
    return out;
  }, [user, hasPermission]);

  return (
    <SidebarProvider>
      <AppSidebar sections={sections} />
      <SidebarInset>
        <DashboardHeader
          userName={user?.name ?? ''}
          userSubtitle={user?.email ?? ''}
        />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
