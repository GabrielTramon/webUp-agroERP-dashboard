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
  TrendingUp, TrendingDown, Wallet, BarChart2, Users, RefreshCw,
  Plus, Banknote, CreditCard, Clock, ArrowDownCircle, ArrowUpCircle,
  ShoppingCart, PackageOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt   = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct   = (v: number) => `${v.toFixed(1)}%`;
const today = () => new Date().toISOString().split('T')[0];

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

type Movement = {
  id: string;
  type: 'ENTRY' | 'EXIT';
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: { id: string; name: string };
};

type ProductRow = {
  productId: string; name: string; currentPrice: number; costPrice: number | null;
  quantity: number; revenue: number; cost: number; profit: number; margin: number;
};

type SellerRow = {
  sellerId: string; name: string;
  totalSales: number; totalRevenue: number; totalCost: number; totalProfit: number; margin: number;
};

type Balance = {
  paidSalesTotal: number;
  manualEntries: number;
  manualExits: number;
  openingBalance: number;
  balance: number;
  hasOpenRegister: boolean;
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
    { id: 'overview',  label: 'Visão Geral',  icon: TrendingUp },
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

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function OverviewTab() {
  const [date, setDate]       = useState(today());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        api.get<DailySummary>(`/financial/summary/daily?date=${date}`),
        api.get<Balance>('/financial/balance'),
      ]);
      setSummary(s);
      setBalance(b);
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Faturamento</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={TrendingUp}    label="Faturamento total"  value={fmt(summary.totalRevenue)}  color="text-foreground" bold />
              <KpiCard icon={Banknote}      label="Recebido no caixa"  value={fmt(summary.totalReceived)} color="text-green-600" bold />
              <KpiCard icon={Clock}         label="Vendas a prazo"     value={fmt(summary.totalCredit)}   color="text-amber-600" bold />
              <KpiCard icon={BarChart2}     label="Lucro estimado"     value={fmt(summary.totalProfit)}
                sub={`Margem: ${pct(summary.profitMargin)}`}
                color={summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} bold />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por forma de pagamento</p>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard icon={Banknote}    label="Dinheiro" value={fmt(summary.byPaymentMethod.CASH)}        color="text-blue-600" />
              <KpiCard icon={CreditCard}  label="Débito"   value={fmt(summary.byPaymentMethod.DEBIT)}       color="text-indigo-600" />
              <KpiCard icon={CreditCard}  label="Cartão"   value={fmt(summary.byPaymentMethod.CREDIT_CARD)} color="text-purple-600" />
            </div>
          </div>

          {(summary.movements.totalEntries > 0 || summary.movements.totalExits > 0) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Movimentações manuais</p>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard icon={ArrowUpCircle}   label="Entradas"  value={fmt(summary.movements.totalEntries)} color="text-green-600" />
                <KpiCard icon={ArrowDownCircle} label="Saídas"    value={fmt(summary.movements.totalExits)}   color="text-destructive" />
                <KpiCard icon={Wallet}          label="Saldo mov." value={fmt(summary.movements.net)}
                  color={summary.movements.net >= 0 ? 'text-foreground' : 'text-destructive'} />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Caixa do dia</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard icon={Wallet} label="Saldo inicial" value={fmt(summary.openingBalance)} color="text-muted-foreground" />
              {summary.closingBalance !== null
                ? <KpiCard icon={Wallet} label="Saldo final" value={fmt(summary.closingBalance)} color="text-foreground" />
                : <KpiCard icon={Wallet} label="Saldo final" value="Caixa aberto"
                    sub={summary.registerStatus === 'OPEN' ? 'Em andamento' : 'Sem caixa hoje'}
                    color="text-muted-foreground" />
              }
              <KpiCard icon={ShoppingCart} label="Total de vendas" value={`${summary.totalSales} venda${summary.totalSales !== 1 ? 's' : ''}`} />
            </div>
          </div>
        </>
      )}

      {balance && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Saldo da empresa (acumulado)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={TrendingUp}      label="Vendas recebidas"  value={fmt(balance.paidSalesTotal)} color="text-green-600" />
              <KpiCard icon={ArrowUpCircle}   label="Entradas manuais" value={fmt(balance.manualEntries)}  color="text-blue-600" />
              <KpiCard icon={ArrowDownCircle} label="Saídas manuais"   value={fmt(balance.manualExits)}    color="text-destructive" />
              <KpiCard icon={Wallet}          label="Saldo total"       value={fmt(balance.balance)}
                color={balance.balance >= 0 ? 'text-emerald-600' : 'text-destructive'} bold />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MovementsTab() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading]     = useState(false);
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [typeFilter, setType]     = useState('');
  const [addOpen, setAddOpen]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      if (typeFilter) params.set('type', typeFilter);
      setMovements(await api.get<Movement[]>(`/financial/movements?${params}`));
    } catch { setMovements([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalEntries = movements.filter((m) => m.type === 'ENTRY').reduce((a, m) => a + m.amount, 0);
  const totalExits   = movements.filter((m) => m.type === 'EXIT').reduce((a, m) => a + m.amount, 0);

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
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Valor</TableHead>
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
    </div>
  );
}

function AddMovementModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [type, setType]           = useState<'ENTRY' | 'EXIT'>('EXIT');
  const [category, setCategory]   = useState('EXPENSE');
  const [amount, setAmount]       = useState('');
  const [description, setDesc]    = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

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
    setError('');
    setLoading(true);
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
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all',
                  type === t
                    ? t === 'ENTRY' ? 'border-green-500 bg-green-500 text-white' : 'border-destructive bg-destructive text-white'
                    : 'hover:border-muted-foreground/40 hover:bg-muted',
                )}
              >
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
              <Input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Input placeholder="Ex: Pagamento de aluguel" value={description} onChange={(e) => setDesc(e.target.value)} />
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

function ProductsTab() {
  const [rows, setRows]   = useState<ProductRow[]>([]);
  const [loading, setL]   = useState(false);
  const [from, setFrom]   = useState(today());
  const [to, setTo]       = useState(today());

  async function load() {
    setL(true);
    try {
      setRows(await api.get<ProductRow[]>(`/financial/reports/products?from=${from}&to=${to}`));
    } catch { setRows([]); } finally { setL(false); }
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
        <div className="grid grid-cols-3 gap-3">
          <KpiCard icon={ShoppingCart} label="Total vendido (qtd)" value={`${totQty} un`} />
          <KpiCard icon={TrendingUp}   label="Receita total" value={fmt(totRevenue)} color="text-foreground" />
          <KpiCard icon={BarChart2}    label="Lucro total"   value={fmt(totProfit)}
            color={totProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
        </div>
      )}

      {rows.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhum produto vendido no período.
        </p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
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

function SellersTab() {
  const [rows, setRows] = useState<SellerRow[]>([]);
  const [loading, setL] = useState(false);
  const [from, setFrom] = useState(today());
  const [to, setTo]     = useState(today());

  async function load() {
    setL(true);
    try {
      setRows(await api.get<SellerRow[]>(`/financial/reports/sellers?from=${from}&to=${to}`));
    } catch { setRows([]); } finally { setL(false); }
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
        <div className="grid grid-cols-3 gap-3">
          <KpiCard icon={ShoppingCart} label="Total de vendas" value={`${totSales} venda${totSales !== 1 ? 's' : ''}`} />
          <KpiCard icon={TrendingUp}   label="Receita total"  value={fmt(totRevenue)} color="text-foreground" />
          <KpiCard icon={BarChart2}    label="Lucro total"    value={fmt(totProfit)}
            color={totProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
        </div>
      )}

      {rows.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhuma venda no período.
        </p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
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
