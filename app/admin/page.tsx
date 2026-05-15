'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, UserCircle, TrendingUp,
  ArrowRight, Plus, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getPayload } from '@/lib/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  _count: { users: number; clients: number; sales: number };
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(fullName: string) {
  return fullName.split(' ')[0];
}

export default function AdminHomePage() {
  const payload = getPayload();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const totalUsers   = companies.reduce((acc, c) => acc + c._count.users, 0);
  const totalClients = companies.reduce((acc, c) => acc + c._count.clients, 0);
  const totalSales   = companies.reduce((acc, c) => acc + c._count.sales, 0);

  async function load() {
    setIsLoading(true);
    try {
      setCompanies(await api.get<Company[]>('/admin/companies'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const kpiCards = [
    { label: 'Empresas', value: companies.length, icon: Building2,  colorText: 'text-slate-600',   colorBg: 'bg-slate-100 dark:bg-slate-800'    },
    { label: 'Usuários', value: totalUsers,       icon: Users,      colorText: 'text-blue-600',    colorBg: 'bg-blue-100 dark:bg-blue-950'      },
    { label: 'Clientes', value: totalClients,     icon: UserCircle, colorText: 'text-emerald-600', colorBg: 'bg-emerald-100 dark:bg-emerald-950' },
    { label: 'Vendas',   value: totalSales,       icon: TrendingUp, colorText: 'text-violet-600',  colorBg: 'bg-violet-100 dark:bg-violet-950'  },
  ];

  const quickLinks = [
    {
      href: '/admin/companies',
      icon: Building2,
      title: 'Empresas',
      description: 'Cadastrar e configurar empresas',
      colorText: 'text-slate-600',
      colorBg: 'bg-slate-100 dark:bg-slate-800',
    },
    {
      href: '/admin/users',
      icon: Users,
      title: 'Usuários',
      description: 'Gerenciar admins das empresas',
      colorText: 'text-blue-600',
      colorBg: 'bg-blue-100 dark:bg-blue-950',
    },
  ];

  return (
    <div className="space-y-8">

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()},</p>
          <h1 className="text-2xl font-bold mt-0.5">
            {payload?.name ? getFirstName(payload.name) : 'Admin'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={isLoading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, colorText, colorBg }) => (
          <div key={label} className="rounded-lg border bg-background p-5 flex items-center gap-4">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorBg)}>
              <Icon className={cn('h-5 w-5', colorText)} />
            </div>
            <div>
              <p className="text-xl font-bold">
                {isLoading
                  ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-muted" />
                  : value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Gerenciar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ href, icon: Icon, title, description, colorText, colorBg }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-lg border bg-background p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorBg)}>
                <Icon className={cn('h-5 w-5', colorText)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Empresas cadastradas
          </p>
          <Link href="/admin/companies" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova empresa
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-background h-16 animate-pulse" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
            <Link href="/admin/companies" className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
              Criar primeira empresa
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-background divide-y">
            {companies.map((company) => {
              const accent   = company.primaryColor ?? '#6366f1';
              const initials = company.name.slice(0, 2).toUpperCase();
              return (
                <div key={company.id} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    {company.logoUrl
                      ? <img src={company.logoUrl} alt={company.name} className="h-8 w-8 rounded-lg object-contain" />
                      : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{company.slug}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground">
                    <span>{company._count.users} usuários</span>
                    <span>{company._count.clients} clientes</span>
                    <span>{company._count.sales} vendas</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] hidden md:inline-flex shrink-0">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
