'use client';

import { useEffect, useState } from 'react';
import { Users, UserCircle, Shield, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { getPayload } from '@/lib/auth';

type Stats = {
  users: number;
  clients: number;
  roles: number;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(full: string) {
  return full.split(' ')[0];
}

const cards = [
  {
    key: 'users',
    label: 'Usuários',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    ring: 'ring-blue-100',
  },
  {
    key: 'clients',
    label: 'Clientes',
    icon: UserCircle,
    color: 'bg-emerald-50 text-emerald-600',
    ring: 'ring-emerald-100',
  },
  {
    key: 'roles',
    label: 'Perfis de acesso',
    icon: Shield,
    color: 'bg-violet-50 text-violet-600',
    ring: 'ring-violet-100',
  },
] as const;

export default function DashboardPage() {
  const payload = getPayload();
  const greeting = getGreeting();
  const firstName = payload?.name ? getFirstName(payload.name) : '';

  const [stats, setStats] = useState<Stats>({ users: 0, clients: 0, roles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, clients, roles] = await Promise.all([
          api.get<unknown[]>('/users'),
          api.get<unknown[]>('/clients'),
          api.get<unknown[]>('/roles'),
        ]);
        setStats({
          users: users.length,
          clients: clients.length,
          roles: roles.length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">

      <div className="relative overflow-hidden rounded-2xl bg-[#0057E7] px-8 py-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {firstName || 'Usuário'} 👋
            </h1>
            <p className="mt-2 text-blue-100 text-sm">
              {payload?.role === 'ADMIN'
                ? 'Você tem acesso completo ao sistema.'
                : `Perfil: ${payload?.role ?? ''}`}
            </p>
          </div>
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Visão geral
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ key, label, icon: Icon, color, ring }) => (
            <div
              key={key}
              className={`rounded-2xl bg-white ring-1 ${ring} p-6 flex items-center gap-5 shadow-sm`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block h-6 w-8 animate-pulse rounded bg-gray-100" />
                  ) : (
                    stats[key]
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: '/dashboard/users',   icon: Users,       title: 'Gerenciar usuários',   desc: 'Criar, editar e desativar usuários do sistema',  color: 'bg-blue-600'   },
            { href: '/dashboard/clients', icon: UserCircle,  title: 'Gerenciar clientes',   desc: 'Cadastrar e atualizar clientes da agropecuária', color: 'bg-emerald-600' },
          ].map(({ href, icon: Icon, title, desc, color }) => (
            <a
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl bg-white ring-1 ring-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-[#0057E7] transition-colors">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
