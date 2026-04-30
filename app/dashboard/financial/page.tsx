'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  TrendingUp, Wallet, BarChart2, Users, RefreshCw,
  Plus, Banknote, CreditCard, Clock, ArrowDownCircle, ArrowUpCircle,
  ShoppingCart, PackageOpen, Repeat, CheckCircle2, AlertCircle, Pencil, Trash2, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt      = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct      = (v: number) => `${v.toFixed(1)}%`;
const today    = () => new Date().toISOString().split('T')[0];

function clampMoney(val: string, min = 0.01, max = 999999.99): string {
  const n = parseFloat(val);
  if (isNaN(n) || n < min) return String(min);
  if (n > max) return String(max);
  return String(Math.round(n * 100) / 100);
}
const monthStart = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

type DailySummary = {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalReceived: number;
  totalCredit: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  byPaymentMethod: { CASH: number; DEBIT: number; CREDIT_CARD: number };
  movements: { totalEntries: number; totalExits: number; net: number };
  openingBalance: number;
  closingBalance: number | null;
  registerStatus: 'OPEN' | 'CLOSED' | null;
};

type LiquidBalance = {
  cashTotal: number;
  debitSettled: number;
  debitPending: number;
  cardSettled: number;
  cardPending: number;
  creditReceived: number;
  creditPendingAmt: number;
  entries: number;
  exits: number;
  settled: number;
  liquidBalance: number;
  monthlyDue: number;
  dueExpenses: { name: string; amount: number; dayOfMonth: number; overdue: boolean }[];
  projectedBalance: number;
};

type Movement = {
  id: string;
  type: 'ENTRY' | 'EXIT';
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: { id: string; name: string };
};

type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string | null;
  dayOfMonth: number;
  active: boolean;
  paidThisMonth: boolean;
  overdue: boolean;
};

type ProductRow = {
  productId: string; name: string; currentPrice: number; costPrice: number | null;
  quantity: number; revenue: number; cost: number; profit: number; margin: number;
};

type SellerRow = {
  sellerId: string; name: string;
  totalSales: number; totalRevenue: number; totalCost: number; totalProfit: number; margin: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  SALE:              'Venda',
  PAYMENT_RECEIVED:  'Recebimento',
  WITHDRAWAL:        'Retirada',
  EXPENSE:           'Despesa',
  PURCHASE:          'Compra',
  OTHER:             'Outros',
};

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'products' | 'sellers'>('overview');

  const tabs = [
    { id: 'overview',  label: 'Visão Geral',   icon: TrendingUp },
    { id: 'movements', label: 'Movimentações', icon: Wallet },
    { id: 'products',  label: 'Produtos',      icon: PackageOpen },
    { id: 'sellers',   label: 'Vendedores',    icon: Users },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b pb-3 shrink-0 flex-wrap">
        <h1 className="text-2xl font-bold mr-2">Financeiro</h1>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 pt-4 overflow-y-auto">
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'movements' && <MovementsTab />}
        {activeTab === 'products'  && <ProductsTab />}
        {activeTab === 'sellers'   && <SellersTab />}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color = 'text-foreground', bold,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color?: string; bold?: boolean;
}) {
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-1.5">
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', color)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn('text-lg tabular-nums', bold ? 'font-bold' : 'font-semibold', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab() {
  const [date, setDate]       = useState(today());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [liquid, setLiquid]   = useState<LiquidBalance | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.get<DailySummary>(`/financial/summary/daily?date=${date}`),
        api.get<LiquidBalance>('/financial/liquid-balance'),
      ]);
      setSummary(s);
      setLiquid(l);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data</Label>
          <Input type="date" className="h-8 text-sm w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="mt-5">
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {summary && (
        <>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Faturamento do dia</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={TrendingUp} label="Faturamento total"  value={fmt(summary.totalRevenue)}  bold />
              <KpiCard icon={Banknote}   label="Recebido no caixa"  value={fmt(summary.totalReceived)} color="text-green-600" bold />
              <KpiCard icon={Clock}      label="Vendas a prazo"     value={fmt(summary.totalCredit)}   color="text-amber-600" bold />
              <KpiCard icon={BarChart2}  label="Lucro estimado"     value={fmt(summary.totalProfit)}
                sub={`Margem: ${pct(summary.profitMargin)}`}
                color={summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} bold />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por forma de pagamento</p>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard icon={Banknote}   label="Dinheiro" value={fmt(summary.byPaymentMethod.CASH)}        color="text-blue-600" />
              <KpiCard icon={CreditCard} label="Débito"   value={fmt(summary.byPaymentMethod.DEBIT)}       color="text-indigo-600" />
              <KpiCard icon={CreditCard} label="Cartão"   value={fmt(summary.byPaymentMethod.CREDIT_CARD)} color="text-purple-600" />
            </div>

          </div>

          {(summary.movements.totalEntries > 0 || summary.movements.totalExits > 0) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Movimentações manuais</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard icon={ArrowUpCircle}   label="Entradas"   value={fmt(summary.movements.totalEntries)} color="text-green-600" />
                <KpiCard icon={ArrowDownCircle} label="Saídas"     value={fmt(summary.movements.totalExits)}   color="text-destructive" />
                <KpiCard icon={Wallet}          label="Saldo mov." value={fmt(summary.movements.net)}
                  color={summary.movements.net >= 0 ? 'text-foreground' : 'text-destructive'} />
              </div>
            </div>
          )}
        </>
      )}

      {liquid && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Saldo líquido real (acumulado)
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Dinheiro = imediato · Débito = D+1 · Cartão = D+30 por parcela · A prazo = somente quando quitado
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={Banknote}        label="Dinheiro recebido"    value={fmt(liquid.cashTotal)}       color="text-blue-600" />
              <KpiCard icon={CreditCard}      label="Débito liquidado"     value={fmt(liquid.debitSettled)}
                sub={liquid.debitPending > 0 ? `+${fmt(liquid.debitPending)} a liquidar (D+1)` : undefined}
                color="text-indigo-600" />
              <KpiCard icon={CreditCard}      label="Cartão liquidado"     value={fmt(liquid.cardSettled)}
                sub={liquid.cardPending > 0 ? `+${fmt(liquid.cardPending)} parcelas futuras` : undefined}
                color="text-purple-600" />
              <KpiCard icon={Clock}           label="A prazo recebido"     value={fmt(liquid.creditReceived)}
                sub={liquid.creditPendingAmt > 0 ? `${fmt(liquid.creditPendingAmt)} ainda pendente` : undefined}
                color="text-amber-600" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <KpiCard icon={ArrowUpCircle}   label="Entradas manuais"    value={fmt(liquid.entries)}          color="text-green-600" />
              <KpiCard icon={ArrowDownCircle} label="Saídas manuais"      value={fmt(liquid.exits)}            color="text-destructive" />
              <KpiCard icon={Wallet}          label="Saldo líquido real"  value={fmt(liquid.liquidBalance)}
                color={liquid.liquidBalance >= 0 ? 'text-emerald-600' : 'text-destructive'} bold />
            </div>

            {liquid.dueExpenses.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Despesas fixas pendentes este mês — {fmt(liquid.monthlyDue)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {liquid.dueExpenses.map((e) => (
                    <span key={e.name} className={cn(
                      'text-xs px-2 py-1 rounded-md border',
                      e.overdue
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/40',
                    )}>
                      {e.name} · {fmt(e.amount)} · dia {e.dayOfMonth}
                      {e.overdue && ' ⚠ atrasada'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Saldo projetado após despesas fixas: <strong className={cn(liquid.projectedBalance >= 0 ? 'text-foreground' : 'text-destructive')}>{fmt(liquid.projectedBalance)}</strong>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Movimentações ─────────────────────────────────────────────────────────────

function MovementsTab() {
  const [movements, setMovements]   = useState<Movement[]>([]);
  const [recurring, setRecurring]   = useState<RecurringExpense[]>([]);
  const [loading, setLoading]       = useState(false);
  const [deleteError, setDelErr]    = useState('');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [typeFilter, setType]       = useState('');
  const [addOpen, setAddOpen]       = useState(false);
  const [editMovement, setEditMov]  = useState<Movement | null>(null);
  const [recurringOpen, setRecOpen] = useState(false);
  const [editRecurring, setEditRec] = useState<RecurringExpense | null>(null);
  const [confirmDelete, setConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);

  async function load() {
    setLoading(true);
    try {
      // Auto-processa despesas recorrentes vencidas antes de buscar movimentos
      await api.post('/financial/recurring/process', {}).catch(() => {});

      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      if (typeFilter) params.set('type', typeFilter);
      const [mv, rec] = await Promise.all([
        api.get<Movement[]>(`/financial/movements?${params}`),
        api.get<RecurringExpense[]>('/financial/recurring'),
      ]);
      setMovements(mv);
      setRecurring(rec);
    } catch { setMovements([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function confirmDeleteMovement(m: Movement) {
    setConfirm({
      label: `Excluir a movimentação "${m.description}" de ${fmt(m.amount)}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/financial/movements/${m.id}`);
          setMovements((prev) => prev.filter((x) => x.id !== m.id));
        } catch (e) {
          setDelErr(e instanceof Error ? e.message : 'Erro ao excluir movimentação');
        }
      },
    });
  }

  function confirmDeleteRecurring(r: RecurringExpense) {
    setDelErr('');
    setConfirm({
      label: `Excluir a despesa fixa "${r.name}" de ${fmt(r.amount)}/mês?`,
      onConfirm: async () => {
        try {
          await api.delete(`/financial/recurring/${r.id}`);
          setRecurring((prev) => prev.filter((x) => x.id !== r.id));
        } catch (e) {
          setDelErr(e instanceof Error ? e.message : 'Erro ao excluir');
        }
      },
    });
  }

  const totalEntries = movements.filter((m) => m.type === 'ENTRY').reduce((a, m) => a + m.amount, 0);
  const totalExits   = movements.filter((m) => m.type === 'EXIT').reduce((a, m) => a + m.amount, 0);
  const activeRec    = recurring.filter((r) => r.active);
  const monthlyFixed = activeRec.reduce((a, r) => a + r.amount, 0);
  const pendingRec   = activeRec.filter((r) => !r.paidThisMonth).length;

  return (
    <div className="space-y-6">

      {/* ── Despesas fixas mensais ── */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Despesas fixas mensais</span>
            {activeRec.length > 0 && (
              <Badge variant="secondary">{fmt(monthlyFixed)}/mês</Badge>
            )}
            {pendingRec > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingRec} pendente{pendingRec > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => { setEditRec(null); setRecOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova despesa fixa
          </Button>
        </div>

        {deleteError && (
          <p className="px-4 py-2 text-xs text-destructive bg-destructive/10 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 shrink-0" />{deleteError}
          </p>
        )}
        {activeRec.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nenhuma despesa fixa cadastrada.
          </p>
        ) : (
          <div className="divide-y">
            {recurring.map((rec) => (
              <div key={rec.id} className={cn(
                'flex items-center gap-3 px-4 py-3',
                !rec.active && 'opacity-40',
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{rec.name}</p>
                    {rec.paidThisMonth ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs h-5">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Pago
                      </Badge>
                    ) : rec.overdue ? (
                      <Badge variant="outline" className="text-destructive border-destructive/40 text-xs h-5">
                        <AlertCircle className="h-3 w-3 mr-1" />Atrasado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs h-5">
                        Vence dia {rec.dayOfMonth}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {CATEGORY_LABELS[rec.category] ?? rec.category}
                    {rec.description && ` · ${rec.description}`}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-semibold tabular-nums shrink-0',
                  rec.paidThisMonth ? 'text-muted-foreground line-through' : 'text-destructive',
                )}>
                  -{fmt(rec.amount)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => { setEditRec(rec); setRecOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => confirmDeleteRecurring(rec)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Movimentações avulsas ── */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border p-4 bg-muted/20">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input type="date" className="h-8 text-sm w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input type="date" className="h-8 text-sm w-36" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <select value={typeFilter} onChange={(e) => setType(e.target.value)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm w-32">
            <option value="">Todos</option>
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Saída</option>
          </select>
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Buscar
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova movimentação
        </Button>
      </div>

      {movements.length > 0 && (
        <div className="flex gap-4 text-sm px-1">
          <span className="text-green-600 font-medium">Entradas: {fmt(totalEntries)}</span>
          <span className="text-destructive font-medium">Saídas: {fmt(totalExits)}</span>
          <span className={cn('font-semibold', totalEntries - totalExits >= 0 ? 'text-foreground' : 'text-destructive')}>
            Saldo: {fmt(totalEntries - totalExits)}
          </span>
        </div>
      )}

      {movements.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhuma movimentação encontrada.
        </p>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table className="min-w-160">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(m.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    {m.type === 'ENTRY'
                      ? <Badge variant="outline" className="text-green-600 border-green-300">Entrada</Badge>
                      : <Badge variant="outline" className="text-destructive border-destructive/30">Saída</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CATEGORY_LABELS[m.category] ?? m.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                  <TableCell className="text-muted-foreground">{m.createdBy.name}</TableCell>
                  <TableCell className={cn('text-right font-semibold tabular-nums',
                    m.type === 'ENTRY' ? 'text-green-600' : 'text-destructive')}>
                    {m.type === 'ENTRY' ? '+' : '-'}{fmt(m.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => setEditMov(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => confirmDeleteMovement(m)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddMovementModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); load(); }}
      />
      <ConfirmDeleteModal
        item={confirmDelete}
        onClose={() => setConfirm(null)}
      />
      <EditMovementModal
        movement={editMovement}
        onClose={() => setEditMov(null)}
        onSaved={(updated) => {
          setMovements((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          setEditMov(null);
        }}
      />
      <RecurringModal
        open={recurringOpen}
        expense={editRecurring}
        onClose={() => { setRecOpen(false); setEditRec(null); }}
        onSaved={() => { setRecOpen(false); setEditRec(null); load(); }}
      />
    </div>
  );
}

// ─── Modal: Nova movimentação avulsa ──────────────────────────────────────────

function AddMovementModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [type, setType]         = useState<'ENTRY' | 'EXIT'>('EXIT');
  const [category, setCategory] = useState('EXPENSE');
  const [amount, setAmount]     = useState('');
  const [description, setDesc]  = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const entryCategories = [
    { value: 'PAYMENT_RECEIVED', label: 'Recebimento' },
    { value: 'OTHER',            label: 'Outros' },
  ];
  const exitCategories = [
    { value: 'WITHDRAWAL', label: 'Retirada' },
    { value: 'EXPENSE',    label: 'Despesa' },
    { value: 'PURCHASE',   label: 'Compra de mercadoria' },
    { value: 'OTHER',      label: 'Outros' },
  ];

  function handleTypeChange(t: 'ENTRY' | 'EXIT') {
    setType(t);
    setCategory(t === 'ENTRY' ? 'PAYMENT_RECEIVED' : 'EXPENSE');
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) { setError('Informe um valor válido'); return; }
    if (!description.trim()) { setError('Informe uma descrição'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/financial/movements', { type, category, amount: parseFloat(amount), description });
      setAmount(''); setDesc(''); setError('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar movimentação');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['ENTRY', 'EXIT'] as const).map((t) => (
              <button key={t} onClick={() => handleTypeChange(t)}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all',
                  type === t
                    ? t === 'ENTRY' ? 'border-green-500 bg-green-500 text-white' : 'border-destructive bg-destructive text-white'
                    : 'hover:border-muted-foreground/40 hover:bg-muted',
                )}>
                {t === 'ENTRY' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                {t === 'ENTRY' ? 'Entrada' : 'Saída'}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
              {(type === 'ENTRY' ? entryCategories : exitCategories).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input type="number" min="0.01" max="999999.99" step="0.01" placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={(e) => setAmount(clampMoney(e.target.value))}
                className="pl-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Input placeholder="Ex: Pagamento de aluguel" maxLength={200}
              value={description} onChange={(e) => setDesc(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal: Confirmação de exclusão ──────────────────────────────────────────

function ConfirmDeleteModal({ item, onClose }: {
  item: { label: string; onConfirm: () => void } | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!item) return;
    setLoading(true);
    await item.onConfirm();
    setLoading(false);
    onClose();
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Confirmar exclusão
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{item?.label}</p>
        <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal: Editar movimentação avulsa ───────────────────────────────────────

function EditMovementModal({ movement, onClose, onSaved }: {
  movement: Movement | null;
  onClose: () => void;
  onSaved: (updated: Movement) => void;
}) {
  const [amount, setAmount]       = useState('');
  const [description, setDesc]    = useState('');
  const [category, setCategory]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (movement) {
      setAmount(String(movement.amount));
      setDesc(movement.description);
      setCategory(movement.category);
    }
    setError('');
  }, [movement]);

  const entryCategories = [
    { value: 'PAYMENT_RECEIVED', label: 'Recebimento' },
    { value: 'OTHER',            label: 'Outros' },
  ];
  const exitCategories = [
    { value: 'WITHDRAWAL', label: 'Retirada' },
    { value: 'EXPENSE',    label: 'Despesa' },
    { value: 'PURCHASE',   label: 'Compra de mercadoria' },
    { value: 'OTHER',      label: 'Outros' },
  ];
  const categories = movement?.type === 'ENTRY' ? entryCategories : exitCategories;

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) { setError('Informe um valor válido'); return; }
    if (!description.trim()) { setError('Informe uma descrição'); return; }
    setError(''); setLoading(true);
    try {
      const updated = await api.put<Movement>(`/financial/movements/${movement!.id}`, {
        amount: parseFloat(amount),
        description,
        category,
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={!!movement} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Editar movimentação</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input type="number" min="0.01" max="999999.99" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={(e) => setAmount(clampMoney(e.target.value))}
                className="pl-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Input maxLength={200} value={description} onChange={(e) => setDesc(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal: Despesa fixa mensal ───────────────────────────────────────────────

function RecurringModal({ open, expense, onClose, onSaved }: {
  open: boolean;
  expense: RecurringExpense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]           = useState('');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('EXPENSE');
  const [description, setDesc]    = useState('');
  const [dayOfMonth, setDay]      = useState('1');
  const [active, setActive]       = useState(true);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setDesc(expense.description ?? '');
      setDay(String(expense.dayOfMonth));
      setActive(expense.active);
    } else {
      setName(''); setAmount(''); setCategory('EXPENSE');
      setDesc(''); setDay('1'); setActive(true);
    }
    setError('');
  }, [expense, open]);

  const exitCategories = [
    { value: 'WITHDRAWAL', label: 'Retirada' },
    { value: 'EXPENSE',    label: 'Despesa' },
    { value: 'PURCHASE',   label: 'Compra de mercadoria' },
    { value: 'OTHER',      label: 'Outros' },
  ];

  async function handleSave() {
    if (!name.trim()) { setError('Informe o nome'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Informe um valor válido'); return; }
    const day = parseInt(dayOfMonth, 10);
    if (!day || day < 1 || day > 28) { setError('Dia deve ser entre 1 e 28'); return; }
    setError(''); setLoading(true);
    try {
      const payload = { name, amount: parseFloat(amount), category, description: description || undefined, dayOfMonth: day, active };
      if (expense) {
        await api.put(`/financial/recurring/${expense.id}`, payload);
      } else {
        await api.post('/financial/recurring', payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar despesa fixa' : 'Nova despesa fixa mensal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input placeholder="Ex: Aluguel, Energia, Salário..." maxLength={100}
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input type="number" min="0.01" max="999999.99" step="0.01" placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={(e) => setAmount(clampMoney(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vence todo dia</Label>
              <select value={dayOfMonth} onChange={(e) => setDay(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
              {exitCategories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição (opcional)</Label>
            <Input placeholder="Observação" value={description} onChange={(e) => setDesc(e.target.value)} />
          </div>
          {expense && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
              Despesa ativa
            </label>
          )}
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : expense ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Produtos ─────────────────────────────────────────────────────────────────

function ProductsTab() {
  const [rows, setRows]   = useState<ProductRow[]>([]);
  const [loading, setL]   = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom]   = useState(monthStart());
  const [to, setTo]       = useState(today());

  async function load() {
    setL(true); setError('');
    try {
      setRows(await api.get<ProductRow[]>(`/financial/reports/products?from=${from}&to=${to}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar relatório');
      setRows([]);
    } finally { setL(false); }
  }

  useEffect(() => { load(); }, []);

  const totRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const totProfit  = rows.reduce((a, r) => a + r.profit, 0);
  const totQty     = rows.reduce((a, r) => a + r.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end rounded-xl border p-4 bg-muted/20">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input type="date" className="h-8 text-sm w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input type="date" className="h-8 text-sm w-36" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Buscar
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard icon={ShoppingCart} label="Total vendido (qtd)" value={`${totQty} un`} />
          <KpiCard icon={TrendingUp}   label="Receita total" value={fmt(totRevenue)} />
          <KpiCard icon={BarChart2}    label="Lucro total"   value={fmt(totProfit)}
            color={totProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive py-4 border border-destructive/30 rounded-xl bg-destructive/5">{error}</p>
      )}
      {rows.length === 0 && !loading && !error ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhum produto vendido no período.
        </p>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table className="min-w-150">
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço atual</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Qtd vendida</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(r.currentPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.costPrice != null ? fmt(r.costPrice) : <span className="text-xs italic">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmt(r.revenue)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums font-semibold',
                    r.profit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                    {fmt(r.profit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant={r.margin >= 20 ? 'default' : r.margin >= 10 ? 'secondary' : 'outline'}>
                      {pct(r.margin)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Vendedores ───────────────────────────────────────────────────────────────

function SellersTab() {
  const [rows, setRows] = useState<SellerRow[]>([]);
  const [loading, setL] = useState(false);
  const [error, setErr] = useState('');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo]     = useState(today());

  async function load() {
    setL(true); setErr('');
    try {
      setRows(await api.get<SellerRow[]>(`/financial/reports/sellers?from=${from}&to=${to}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao carregar relatório');
      setRows([]);
    } finally { setL(false); }
  }

  useEffect(() => { load(); }, []);

  const totRevenue = rows.reduce((a, r) => a + r.totalRevenue, 0);
  const totProfit  = rows.reduce((a, r) => a + r.totalProfit, 0);
  const totSales   = rows.reduce((a, r) => a + r.totalSales, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end rounded-xl border p-4 bg-muted/20">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input type="date" className="h-8 text-sm w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input type="date" className="h-8 text-sm w-36" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Buscar
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard icon={ShoppingCart} label="Total de vendas" value={`${totSales} venda${totSales !== 1 ? 's' : ''}`} />
          <KpiCard icon={TrendingUp}   label="Receita total"   value={fmt(totRevenue)} />
          <KpiCard icon={BarChart2}    label="Lucro total"     value={fmt(totProfit)}
            color={totProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive py-4 border border-destructive/30 rounded-xl bg-destructive/5">{error}</p>
      )}
      {rows.length === 0 && !loading && !error ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhuma venda no período.
        </p>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table className="min-w-125">
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Qtd vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.sellerId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.totalSales}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmt(r.totalRevenue)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(r.totalCost)}</TableCell>
                  <TableCell className={cn('text-right tabular-nums font-semibold',
                    r.totalProfit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                    {fmt(r.totalProfit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant={r.margin >= 20 ? 'default' : r.margin >= 10 ? 'secondary' : 'outline'}>
                      {pct(r.margin)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
