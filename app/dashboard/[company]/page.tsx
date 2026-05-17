'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users, UserCircle, Shield, TrendingUp, AlertTriangle,
  Building2, Plus, Pencil, ShoppingBasket, Landmark, BarChart2,
  RefreshCw, UserPlus, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getPayload } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Company = {
  id: string; name: string; slug: string;
  logoUrl: string | null; primaryColor: string | null; createdAt: string;
  _count: { users: number; clients: number; sales: number };
};

type Stats = { users: number; clients: number; roles: number };

type OverdueEntry = {
  client: { id: string; name: string; phone: string | null; email: string | null };
  total: number;
  sales: { id: string; total: number; dueDate: string | null }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(full: string) { return full.split(' ')[0]; }

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    setIsSuperAdmin(!!getPayload()?.isSuperAdmin);
  }, []);

  if (isSuperAdmin === null) return null;
  if (isSuperAdmin) return <SuperAdminHome />;
  return <UserDashboard />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Super Admin Home
// ═══════════════════════════════════════════════════════════════════════════════

function SuperAdminHome() {
  const [adminName, setAdminName] = useState('Admin');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [createOpen, setCreateOpen]   = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [userTarget, setUserTarget]   = useState<Company | null>(null);

  async function load() {
    setLoading(true);
    try { setCompanies(await api.get<Company[]>('/admin/companies')); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const p = getPayload();
    setAdminName(p?.name ? getFirstName(p.name) : 'Admin');
    load();
  }, []);

  const totalUsers   = companies.reduce((a, c) => a + c._count.users, 0);
  const totalClients = companies.reduce((a, c) => a + c._count.clients, 0);
  const totalSales   = companies.reduce((a, c) => a + c._count.sales, 0);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-6 sm:px-8 py-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="text-slate-300 border-slate-600 bg-slate-800/60 text-xs mb-3">
              Super Admin
            </Badge>
            <p className="text-slate-400 text-sm font-medium mb-1">{getGreeting()},</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {adminName} 👋
            </h1>
            <p className="mt-2 text-slate-400 text-sm max-w-sm">
              Painel global — gerencie todas as empresas do sistema.
            </p>
          </div>
          <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Visão global
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Empresas',  value: companies.length, icon: Building2,  color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800'      },
            { label: 'Usuários',  value: totalUsers,       icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-950'         },
            { label: 'Clientes',  value: totalClients,     icon: UserCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950'   },
            { label: 'Vendas',    value: totalSales,       icon: TrendingUp, color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-950'     },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {loading
                    ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-muted" />
                    : value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Companies ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Empresas cadastradas
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova empresa
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border bg-card h-44 animate-pulse" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada</p>
            <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Criar primeira empresa
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={() => setEditCompany(company)}
                onCreateUser={() => setUserTarget(company)}
              />
            ))}
          </div>
        )}
      </div>

      <CompanyModal
        open={createOpen}
        company={null}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); load(); }}
      />
      <CompanyModal
        open={!!editCompany}
        company={editCompany}
        onClose={() => setEditCompany(null)}
        onSuccess={() => { setEditCompany(null); load(); }}
      />
      <CreateAdminUserModal
        open={!!userTarget}
        company={userTarget}
        onClose={() => setUserTarget(null)}
        onSuccess={() => { setUserTarget(null); load(); }}
      />
    </div>
  );
}

function CompanyCard({
  company, onEdit, onCreateUser,
}: {
  company: Company;
  onEdit: () => void;
  onCreateUser: () => void;
}) {
  const accent   = company.primaryColor ?? '#6366f1';
  const initials = company.name.slice(0, 2).toUpperCase();
  const created  = new Date(company.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-1.5 shrink-0" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-10 w-10 rounded-xl object-contain border shrink-0" />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: accent }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground truncate">{company.slug}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Usuários', value: company._count.users   },
            { label: 'Clientes', value: company._count.clients },
            { label: 'Vendas',   value: company._count.sales   },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/50 px-3 py-2 text-center">
              <p className="text-base font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Criada em {created}</p>
          <Button size="sm" variant="outline" onClick={onCreateUser} className="h-7 text-xs gap-1">
            <UserPlus className="h-3 w-3" />
            Criar admin
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompanyModal({ open, company, onClose, onSuccess }: {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName]       = useState('');
  const [color, setColor]     = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (open) {
      setName(company?.name ?? '');
      setColor(company?.primaryColor ?? '');
      setLogoUrl(company?.logoUrl ?? '');
      setError('');
    }
  }, [open, company]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setError(''); setLoading(true);
    try {
      const payload = { name, primaryColor: color || undefined, logoUrl: logoUrl || undefined };
      if (company) {
        await api.patch(`/admin/companies/${company.id}`, payload);
      } else {
        await api.post('/admin/companies', payload);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nome da empresa" maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Cor primária <span className="text-xs text-muted-foreground font-normal">opcional</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-10 rounded cursor-pointer border bg-transparent p-0.5"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              URL do logo <span className="text-xs text-muted-foreground font-normal">opcional</span>
            </Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : company ? 'Salvar' : 'Criar empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateAdminUserModal({ open, company, onClose, onSuccess }: {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (open) { setName(''); setEmail(''); setPass(''); setPhone(''); setError(''); }
  }, [open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setError(''); setLoading(true);
    try {
      await api.post('/admin/users', {
        name, email, password,
        phone: phone || undefined,
        companyId: company.id,
      });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar usuário');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Criar Admin
            {company && <span className="text-muted-foreground font-normal"> — {company.name}</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Senha <span className="text-destructive">*</span></Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPass(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone <span className="text-xs text-muted-foreground font-normal">opcional</span></Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// User Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

const statCards = [
  { key: 'users',   label: 'Usuários',         icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-950'         },
  { key: 'clients', label: 'Clientes',          icon: UserCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950'   },
  { key: 'roles',   label: 'Perfis de acesso',  icon: Shield,     color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-950'     },
] as const;

function buildQuickLinks(company: string) {
  return [
    { href: `/dashboard/${company}/users`,         icon: Users,         title: 'Usuários',     desc: 'Criar e gerenciar usuários',       color: '#2563eb' },
    { href: `/dashboard/${company}/clients`,       icon: UserCircle,    title: 'Clientes',     desc: 'Cadastrar e consultar clientes',   color: '#059669' },
    { href: `/dashboard/${company}/products`,      icon: ShoppingBasket,title: 'Produtos',     desc: 'Estoque, preços e categorias',     color: '#d97706' },
    { href: `/dashboard/${company}/sales`,         icon: TrendingUp,    title: 'Vendas / PDV', desc: 'Registrar e consultar vendas',     color: '#7c3aed' },
    { href: `/dashboard/${company}/cash-register`, icon: Landmark,      title: 'Caixa',        desc: 'Abrir, fechar e finalizar vendas', color: '#0891b2' },
    { href: `/dashboard/${company}/financial`,     icon: BarChart2,     title: 'Financeiro',   desc: 'Relatórios e movimentações',       color: '#be185d' },
  ];
}

function UserDashboard() {
  const { company } = useParams<{ company: string }>();
  const quickLinks = buildQuickLinks(company);

  const [greeting, setGreeting]     = useState('');
  const [firstName, setFirstName]   = useState('');
  const [companyLabel, setCompanyLabel] = useState('');
  const [stats, setStats]           = useState<Stats>({ users: 0, clients: 0, roles: 0 });
  const [overdue, setOverdue]       = useState<OverdueEntry[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const p = getPayload();
    setFirstName(p?.name ? getFirstName(p.name) : '');
    setGreeting(getGreeting());
    setCompanyLabel(
      p?.companyName ?? (p?.role === 'ADMIN' ? 'Acesso completo ao sistema' : `Perfil: ${p?.role ?? ''}`),
    );
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [users, clients, roles, overdueData] = await Promise.all([
          api.get<unknown[]>('/users'),
          api.get<unknown[]>('/clients'),
          api.get<unknown[]>('/roles'),
          api.get<OverdueEntry[]>('/clients/overdue').catch(() => []),
        ]);
        setStats({ users: users.length, clients: clients.length, roles: roles.length });
        setOverdue(overdueData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const overdueTotal = overdue.reduce((a, e) => a + e.total, 0);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0057E7] px-6 sm:px-8 py-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {firstName || 'Usuário'} 👋
            </h1>
            <p className="mt-2 text-blue-100 text-sm">
              {companyLabel}
            </p>
          </div>
          <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Visão geral
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="rounded-2xl border bg-card p-6 flex items-center gap-5">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading
                    ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted" />
                    : stats[key]}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overdue ── */}
      {(overdue.length > 0 || loading) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Contas em atraso
            </p>
            {!loading && (
              <span className="ml-auto text-sm font-semibold text-destructive">
                Total: {fmt(overdueTotal)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-card h-24 animate-pulse" />
          ) : (
            <div className="rounded-2xl border overflow-x-auto">
              <table className="w-full text-sm min-w-125">
                <thead className="border-b bg-destructive/5">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Contato</th>
                    <th className="px-5 py-3 text-center font-medium text-muted-foreground">Vendas</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total em aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((entry) => (
                    <tr key={entry.client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium">{entry.client.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {entry.client.phone ?? entry.client.email ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="destructive">{entry.sales.length}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-destructive">
                        {fmt(entry.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-bold">
                    <td className="px-5 py-3 text-muted-foreground" colSpan={3}>Total em atraso</td>
                    <td className="px-5 py-3 text-right text-destructive">{fmt(overdueTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Quick links ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Acesso rápido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ href, icon: Icon, title, desc, color }) => (
            <a
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
