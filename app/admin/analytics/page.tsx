'use client';

import {
  Building2, Users, UserCircle, ShoppingBasket, TrendingUp,
  DollarSign, Activity, Clock, BarChart3, RefreshCw, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAnalytics, type CompanyAnalytics } from '@/lib/queries';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const fmtNum = (v: number) => v.toLocaleString('pt-BR');

function formatAge(days: number): string {
  if (days < 1) return 'Hoje';
  if (days < 30) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  return remMonths > 0 ? `${years}a ${remMonths}m` : `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function CompanyAvatar({ company, size = 'md' }: { company: CompanyAnalytics; size?: 'sm' | 'md' }) {
  const accent = company.primaryColor ?? '#6366f1';
  const initials = company.name.slice(0, 2).toUpperCase();
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (company.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={company.logoUrl}
        alt={company.name}
        className={cn('rounded-xl object-contain border bg-card shrink-0', dims)}
      />
    );
  }
  return (
    <div
      className={cn('rounded-xl flex items-center justify-center text-white font-bold shrink-0', dims)}
      style={{ backgroundColor: accent }}
    >
      {initials}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading: loading, refetch, isFetching } = useAnalytics();
  const companies = data?.companies ?? [];
  const totals = data?.totals;

  const byScore = [...companies].sort((a, b) => b.score - a.score).slice(0, 8);
  const byRecent = [...companies]
    .sort((a, b) => b.activity.salesLast30Days - a.activity.salesLast30Days)
    .slice(0, 5);
  const byAge = [...companies].sort((a, b) => b.ageDays - a.ageDays).slice(0, 5);
  const byRevenue = [...companies].sort((a, b) => b.revenue.total - a.revenue.total).slice(0, 5);

  const maxScore = byScore[0]?.score ?? 1;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-6 sm:px-8 py-8">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="text-slate-300 border-slate-600 bg-slate-800/60 text-xs mb-3">
              Analytics
            </Badge>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Performance global
            </h1>
            <p className="mt-2 text-slate-400 text-sm max-w-md">
              Ranking de uso, vendas e tempo de empresa para todas as empresas no sistema.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Visão geral
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Empresas',   value: totals?.companies, icon: Building2,     bg: 'bg-slate-100 dark:bg-slate-800',     color: 'text-slate-700 dark:text-slate-300' },
            { label: 'Usuários',   value: totals?.users,     icon: Users,         bg: 'bg-blue-100 dark:bg-blue-950',       color: 'text-blue-600' },
            { label: 'Clientes',   value: totals?.clients,   icon: UserCircle,    bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
            { label: 'Produtos',   value: totals?.products,  icon: ShoppingBasket,bg: 'bg-amber-100 dark:bg-amber-950',     color: 'text-amber-600' },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {loading
                    ? <span className="inline-block h-5 w-10 animate-pulse rounded bg-muted" />
                    : fmtNum(value ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Vendas & receita
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Vendas totais',        value: totals && fmtNum(totals.sales),                  icon: TrendingUp,  bg: 'bg-violet-100 dark:bg-violet-950', color: 'text-violet-600' },
            { label: 'Vendas 30d',           value: totals && fmtNum(totals.salesLast30Days),        icon: Activity,    bg: 'bg-cyan-100 dark:bg-cyan-950',     color: 'text-cyan-600' },
            { label: 'Receita total',        value: totals && fmtBRL(totals.revenue),                icon: DollarSign,  bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
            { label: 'Receita 30d',          value: totals && fmtBRL(totals.revenueLast30Days),      icon: BarChart3,   bg: 'bg-rose-100 dark:bg-rose-950',     color: 'text-rose-600' },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">
                  {loading
                    ? <span className="inline-block h-5 w-16 animate-pulse rounded bg-muted" />
                    : value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-amber-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Empresas que mais usam o sistema
          </p>
        </div>
        {loading ? (
          <div className="rounded-2xl border bg-card h-64 animate-pulse" />
        ) : byScore.length === 0 ? (
          <EmptyState message="Sem dados ainda" />
        ) : (
          <div className="rounded-2xl border overflow-x-auto bg-card">
            <table className="w-full text-sm min-w-160">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Uso</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Usuários</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Clientes</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Vendas</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Receita</th>
                </tr>
              </thead>
              <tbody>
                {byScore.map((c, i) => {
                  const pct = maxScore > 0 ? (c.score / maxScore) * 100 : 0;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CompanyAvatar company={c} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">{c.counts.users}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{c.counts.clients}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{c.counts.sales}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtBRL(c.revenue.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankingCard
          title="Mais ativas (30 dias)"
          icon={<Activity className="h-4 w-4 text-cyan-500" />}
          empty="Sem vendas recentes"
          loading={loading}
          items={byRecent.map((c) => ({
            company: c,
            primary: fmtNum(c.activity.salesLast30Days),
            primaryLabel: 'vendas',
            secondary: c.activity.salesLast7Days > 0
              ? `${c.activity.salesLast7Days} nos últimos 7 dias`
              : 'sem vendas na última semana',
          }))}
        />

        <RankingCard
          title="Maior receita"
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
          empty="Sem receita registrada"
          loading={loading}
          items={byRevenue.map((c) => ({
            company: c,
            primary: fmtBRL(c.revenue.total),
            primaryLabel: 'total',
            secondary: c.revenue.avgTicket > 0
              ? `Ticket médio ${fmtBRL(c.revenue.avgTicket)}`
              : 'sem ticket médio',
          }))}
        />

        <RankingCard
          title="Clientes mais antigos"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          empty="Sem empresas cadastradas"
          loading={loading}
          items={byAge.map((c) => ({
            company: c,
            primary: formatAge(c.ageDays),
            primaryLabel: 'no sistema',
            secondary: `Desde ${new Date(c.createdAt).toLocaleDateString('pt-BR', {
              month: 'short', year: 'numeric',
            })}`,
          }))}
        />
      </div>
    </div>
  );
}

function RankingCard({
  title, icon, items, loading, empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: { company: CompanyAnalytics; primary: string; primaryLabel: string; secondary: string }[];
  loading: boolean;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="divide-y">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-3 h-16 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map(({ company, primary, primaryLabel, secondary }, i) => (
            <div key={company.id} className="px-5 py-3 flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
              <CompanyAvatar company={company} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{company.name}</p>
                <p className="text-xs text-muted-foreground truncate">{secondary}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm tabular-nums">{primary}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{primaryLabel}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
