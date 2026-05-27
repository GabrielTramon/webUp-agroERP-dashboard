'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  LockOpen, Lock, RefreshCw, TrendingUp, Clock, CheckCircle,
  Banknote, CreditCard, History, Search, Trash2, Plus, Minus,
} from 'lucide-react';

type Seller   = { id: string; name: string };
type Product  = { id: string; name: string; price: number; stock: number; imageUrl: string | null };
type SaleItem = {
  id: string; quantity: number; price: number; subtotal: number;
  product: { id: string; name: string };
};
type CartItem = { productId: string; name: string; price: number; quantity: number; stock: number };
type Sale = {
  id: string;
  total: number;
  discount: number;
  cashierDiscount: number;
  amountReceived: number | null;
  change: number | null;
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'CREDIT' | null;
  status: 'PAID' | 'PENDING';
  customerName: string | null;
  client: { id: string; name: string } | null;
  seller: Seller;
  items: SaleItem[];
  createdAt: string;
  finalizedAt: string | null;
};
type Summary = {
  cashTotal: number; debitTotal: number; creditCardTotal: number;
  creditTotal: number; paidTotal: number; pendingTotal: number;
  grandTotal: number; totalSales: number;
};
type CashRegister = {
  id: string; status: 'OPEN' | 'CLOSED'; openedAt: string; closedAt: string | null;
  openedBy: Seller; closedBy: Seller | null; sales: Sale[]; creditSales: Sale[]; summary: Summary;
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtQty = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};
const parseQty = (raw: string): number => {
  const n = parseFloat(raw.replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
};

function QtyInput({
  quantity, onChange,
}: {
  quantity: number;
  onChange: (raw: string) => void;
}) {
  const [draft, setDraft] = useState(() => fmtQty(quantity));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(fmtQty(quantity));
  }, [quantity, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => { setDraft(e.target.value); onChange(e.target.value); }}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setDraft(fmtQty(quantity)); }}
      onClick={(e) => (e.target as HTMLInputElement).select()}
      className="w-14 h-7 text-center rounded-md border border-input bg-transparent text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', DEBIT: 'Débito', CREDIT_CARD: 'Cartão',
};

export default function CashRegisterPage() {
  const [activeTab, setActiveTab] = useState<'caixa' | 'history'>('caixa');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b pb-3">
        <h1 className="text-2xl font-bold mr-2">Caixa</h1>
        <button
          onClick={() => setActiveTab('caixa')}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'caixa' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Caixa Atual
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <History className="inline h-3.5 w-3.5 mr-1.5" />
          Histórico
        </button>
      </div>
      {activeTab === 'caixa' ? <CaixaTab /> : <HistoryTab />}
    </div>
  );
}

function CaixaTab() {
  const [register, setRegister]     = useState<CashRegister | null>(null);
  const [pending, setPending]       = useState<Sale[]>([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState(false);
  const [error, setError]           = useState('');
  const [finalizing, setFinalizing] = useState<Sale | null>(null);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [reg, pend] = await Promise.all([
        api.get<CashRegister | null>('/cash-register/current'),
        api.get<Sale[]>('/cash-register/pending-sales'),
      ]);
      setRegister(reg);
      setPending(pend);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar caixa');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleOpen() {
    setActing(true);
    setError('');
    try { await api.post('/cash-register/open', {}); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao abrir caixa'); }
    finally { setActing(false); }
  }

  async function handleClose() {
    if (!confirm('Fechar o caixa? Esta ação não pode ser desfeita.')) return;
    setActing(true);
    setError('');
    try { const closed = await api.post<CashRegister>('/cash-register/close', {}); setRegister(closed); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao fechar caixa'); }
    finally { setActing(false); }
  }

  const isOpen = register?.status === 'OPEN';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Carregando caixa...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={isOpen ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {register ? (isOpen ? 'ABERTO' : 'FECHADO') : 'SEM CAIXA'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Atualizar
          </Button>
          {isOpen ? (
            <Button variant="destructive" onClick={handleClose} disabled={acting}>
              <Lock className="h-4 w-4 mr-2" />
              {acting ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          ) : (
            <Button onClick={handleOpen} disabled={acting}>
              <LockOpen className="h-4 w-4 mr-2" />
              {acting ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {register && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
          <span>Aberto por: <strong className="text-foreground">{register.openedBy.name}</strong></span>
          <span>Em: <strong className="text-foreground">{new Date(register.openedAt).toLocaleString('pt-BR')}</strong></span>
          {register.closedBy && <span>Fechado por: <strong className="text-foreground">{register.closedBy.name}</strong></span>}
          {register.closedAt && <span>Em: <strong className="text-foreground">{new Date(register.closedAt).toLocaleString('pt-BR')}</strong></span>}
        </div>
      )}

      {!register && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-3">
          <Lock className="h-10 w-10 opacity-30" />
          <p className="text-sm">Nenhum caixa aberto. Clique em "Abrir Caixa" para começar.</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          Vendas Pendentes
          <Badge variant="secondary">{pending.length}</Badge>
          {!isOpen && pending.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-1">— abra o caixa para finalizar</span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">Nenhuma venda pendente.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border"><Table className="min-w-125">
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(s.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{s.seller.name}</TableCell>
                  <TableCell>{s.client?.name ?? s.customerName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.items.length} item{s.items.length !== 1 ? 's' : ''}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(s.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setFinalizing(s)} disabled={!isOpen}>Finalizar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>

      {register && (
        <>
          <Separator />
          <div>
            <h2 className="font-semibold mb-3">Resumo do Caixa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <SummaryCard icon={TrendingUp}  label="Faturamento do dia" value={fmt(register.summary.grandTotal)}   color="text-foreground" bold />
              <SummaryCard icon={CheckCircle} label="Recebido no caixa"  value={fmt(register.summary.paidTotal)}    color="text-green-600" bold />
              <SummaryCard icon={Clock}       label="Vendas a prazo"     value={fmt(register.summary.creditTotal)}  color="text-amber-600" bold />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard icon={Banknote}   label="Dinheiro" value={fmt(register.summary.cashTotal)}       color="text-blue-600" />
              <SummaryCard icon={CreditCard} label="Débito"   value={fmt(register.summary.debitTotal)}      color="text-indigo-600" />
              <SummaryCard icon={CreditCard} label="Cartão"   value={fmt(register.summary.creditCardTotal)} color="text-purple-600" />
            </div>
          </div>

          <Separator />

          <div>
            {(() => {
              const allDaySales = [...register.sales, ...register.creditSales]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              return (
                <>
                  <h2 className="font-semibold mb-3">
                    Vendas do Dia
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({allDaySales.length} venda{allDaySales.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  {allDaySales.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma venda registrada hoje.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border"><Table className="min-w-150">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Horário</TableHead>
                          <TableHead>Vendedor</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDaySales.map((s) => {
                          const isCredit = s.paymentMethod === 'CREDIT';
                          return (
                            <TableRow key={s.id} className={isCredit ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(s.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell>{s.seller.name}</TableCell>
                              <TableCell>{s.client?.name ?? s.customerName ?? '—'}</TableCell>
                              <TableCell>
                                {isCredit
                                  ? <Badge variant="outline" className="text-amber-600 border-amber-300">A prazo</Badge>
                                  : <Badge variant="outline" className="text-blue-600 border-blue-300">À vista</Badge>
                                }
                              </TableCell>
                              <TableCell>
                                {isCredit
                                  ? <span className="text-muted-foreground text-sm">—</span>
                                  : <Badge variant="outline">{s.paymentMethod ? PAYMENT_LABELS[s.paymentMethod] : '—'}</Badge>
                                }
                              </TableCell>
                              <TableCell>
                                <Badge variant={s.status === 'PAID' ? 'default' : 'secondary'}>
                                  {s.status === 'PAID' ? 'Pago' : 'Pendente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{fmt(s.total)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table></div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      <FinalizeSaleModal
        sale={finalizing}
        onClose={() => setFinalizing(null)}
        onFinalized={() => { setFinalizing(null); loadAll(); }}
      />
    </div>
  );
}

function FinalizeSaleModal({
  sale, onClose, onFinalized,
}: {
  sale: Sale | null;
  onClose: () => void;
  onFinalized: () => void;
}) {
  const [cart, setCart]                               = useState<CartItem[]>([]);
  const [cashierDiscount, setCashierDiscount]         = useState('');
  const [paymentMethod, setPaymentMethod]             = useState<'CASH' | 'DEBIT' | 'CREDIT_CARD'>('CASH');
  const [installments, setInstallments]               = useState(1);
  const [amountReceived, setAmountReceived]           = useState('');
  const [query, setQuery]                             = useState('');
  const [results, setResults]                         = useState<Product[]>([]);
  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState('');
  const searchRef                                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sale) return;
    setCart(sale.items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      price: i.price,
      quantity: i.quantity,
      stock: 9999,
    })));
    setCashierDiscount('');
    setPaymentMethod('CASH');
    setInstallments(1);
    setAmountReceived('');
    setError('');
    setQuery('');
    setResults([]);
  }, [sale]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!query.trim()) { setResults([]); return; }
    searchRef.current = setTimeout(async () => {
      try {
        setResults(await api.get<Product[]>(`/sales/products?q=${encodeURIComponent(query)}`));
      } catch { setResults([]); }
    }, 300);
  }, [query]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock === 0) return prev;
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
    setQuery('');
    setResults([]);
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const next = i.quantity + delta;
        return { ...i, quantity: Math.min(Math.max(next, 0), i.stock) };
      }).filter((i) => i.quantity > 0),
    );
  }

  function setQty(productId: string, raw: string) {
    if (!raw.trim()) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    const qty = parseQty(raw);
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i,
      ),
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const pdvDiscount     = sale?.discount ?? 0;
  const gross           = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const pdvDiscountAmt  = gross * (pdvDiscount / 100);
  const afterPdv        = gross - pdvDiscountAmt;
  const cashDiscountPct = Math.min(parseFloat(cashierDiscount) || 0, 5);
  const cashDiscountAmt = afterPdv * (cashDiscountPct / 100);
  const finalTotal      = afterPdv - cashDiscountAmt;
  const amountRec       = parseFloat(amountReceived) || 0;
  const change          = amountRec - finalTotal;
  const insufficient    = paymentMethod === 'CASH' && amountRec > 0 && change < 0;

  async function handleFinalize() {
    if (!sale) return;
    if (cart.length === 0) { setError('A venda deve ter pelo menos 1 produto'); return; }
    if (paymentMethod === 'CASH' && amountRec < finalTotal) {
      setError('Valor recebido é menor que o total da venda');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/cash-register/finalize/${sale.id}`, {
        paymentMethod,
        cashierDiscount: cashDiscountPct || undefined,
        amountReceived:  paymentMethod === 'CASH' ? amountRec : undefined,
        installments:    paymentMethod === 'CREDIT_CARD' && installments > 1 ? installments : undefined,
        items:           cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      onFinalized();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!sale} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-7 pt-6 pb-4 border-b shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Finalizar Venda</h2>
              {sale && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Criada às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}Vendedor: <strong className="text-foreground">{sale.seller.name}</strong>
                  {sale.client && <>{' · '}Cliente: <strong className="text-foreground">{sale.client.name}</strong></>}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {sale && (
          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

            {/* Coluna esquerda — itens */}
            <div className="flex flex-col gap-5 px-4 md:px-7 py-6 md:flex-1 md:overflow-y-auto md:border-r md:min-w-0 border-b md:border-b-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Itens da venda</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10"
                  placeholder="Buscar e adicionar produto..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover shadow-xl">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={p.stock === 0}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent disabled:opacity-40 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Estoque: {fmtQty(p.stock)}</p>
                        </div>
                        <span className="font-semibold shrink-0 text-primary">{fmt(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border flex-1 overflow-hidden">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Nenhum item na venda</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qtd</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Unit.</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Subtotal</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{item.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => changeQty(item.productId, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <QtyInput
                                quantity={item.quantity}
                                onChange={(raw) => setQty(item.productId, raw)}
                              />
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => changeQty(item.productId, 1)} disabled={item.quantity >= item.stock}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{fmt(item.price)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(item.price * item.quantity)}</td>
                          <td className="px-2 py-3">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-xl bg-muted/40 border px-5 py-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal bruto</span>
                  <span className="tabular-nums">{fmt(gross)}</span>
                </div>
                {pdvDiscount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto PDV ({pdvDiscount}%)</span>
                    <span className="text-green-600 font-medium tabular-nums">− {fmt(pdvDiscountAmt)}</span>
                  </div>
                )}
                {cashDiscountPct > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto Caixa ({cashDiscountPct}%)</span>
                    <span className="text-green-600 font-medium tabular-nums">− {fmt(cashDiscountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-3 border-t mt-1">
                  <span>Total a pagar</span>
                  <span className="text-primary tabular-nums">{fmt(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Coluna direita — pagamento */}
            <div className="md:w-80 shrink-0 flex flex-col gap-5 px-4 md:px-7 py-6 md:overflow-y-auto bg-muted/10">

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pagamento</p>
                <Label className="text-xs text-muted-foreground">Desconto do caixa (máx 5%)</Label>
                <div className="relative">
                  <Input
                    type="number" min="0" max="5" step="0.5" placeholder="0"
                    value={cashierDiscount}
                    onChange={(e) => setCashierDiscount(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forma de Pagamento</p>
                <div className="grid grid-cols-1 gap-2">
                  {(['CASH', 'DEBIT', 'CREDIT_CARD'] as const).map((pm) => (
                    <Button
                      key={pm}
                      size="sm"
                      variant={paymentMethod === pm ? 'default' : 'outline'}
                      onClick={() => { setPaymentMethod(pm); setInstallments(1); }}
                      className="w-full justify-start gap-2 h-10"
                    >
                      {pm === 'CASH' && <Banknote className="h-4 w-4" />}
                      {pm === 'DEBIT' && <CreditCard className="h-4 w-4" />}
                      {pm === 'CREDIT_CARD' && <CreditCard className="h-4 w-4" />}
                      {pm === 'CASH' ? 'Dinheiro' : pm === 'DEBIT' ? 'Débito' : 'Cartão de Crédito'}
                    </Button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Parcelas</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setInstallments(n)}
                        className={`h-9 rounded-lg border text-sm font-medium transition-colors ${
                          installments === n
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {n === 1 ? '1x' : `${n}x`}
                      </button>
                    ))}
                  </div>
                  {installments > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {installments}x de {fmt(finalTotal / installments)} · 1ª parcela em ~30 dias
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Valor recebido <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        max="999999.99"
                        placeholder={finalTotal.toFixed(2)}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        onBlur={(e) => {
                          if (!e.target.value) return;
                          const n = parseFloat(e.target.value);
                          if (isNaN(n) || n < 0) setAmountReceived('0');
                          else if (n > 999999.99) setAmountReceived('999999.99');
                        }}
                        className={`pl-10 h-11 text-base font-semibold ${insufficient ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                    </div>
                    {insufficient && (
                      <p className="text-xs text-destructive font-medium">
                        Faltam {fmt(Math.abs(change))} para cobrir o total.
                      </p>
                    )}
                  </div>

                  <div className={`rounded-xl border-2 px-4 py-4 flex justify-between items-center transition-colors ${
                    amountRec <= 0
                      ? 'border-muted bg-muted/20'
                      : insufficient
                        ? 'border-destructive/40 bg-destructive/5'
                        : change === 0
                          ? 'border-muted bg-muted/30'
                          : 'border-green-400 bg-green-50 dark:bg-green-950/30'
                  }`}>
                    <span className="text-sm font-semibold text-muted-foreground">Troco</span>
                    <span className={`text-2xl font-bold tabular-nums ${
                      amountRec <= 0 || insufficient
                        ? 'text-muted-foreground/40'
                        : change > 0
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}>
                      {amountRec > 0 && !insufficient ? fmt(change) : fmt(0)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button variant="outline" size="lg" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button size="lg" onClick={handleFinalize} disabled={loading || insufficient} className="min-w-36">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Finalizando...
              </span>
            ) : (
              'Confirmar Pagamento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryTab() {
  const [sales, setSales]       = useState<Sale[]>([]);
  const [sellers, setSellers]   = useState<Seller[]>([]);
  const [loading, setLoading]   = useState(false);
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [sellerId, setSellerId] = useState('');
  const [status, setStatus]     = useState('');

  useEffect(() => {
    api.get<Seller[]>('/sales/sellers').then(setSellers).catch(() => {});
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to + 'T23:59:59');
      if (sellerId) params.set('sellerId', sellerId);
      if (status) params.set('status', status);
      setSales(await api.get<Sale[]>(`/sales/history?${params}`));
    } catch { setSales([]); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end rounded-lg border p-4 bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" className="h-8 text-sm w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" className="h-8 text-sm w-36" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vendedor</Label>
          <select
            value={sellerId} onChange={(e) => setSellerId(e.target.value)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm w-40"
          >
            <option value="">Todos</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <select
            value={status} onChange={(e) => setStatus(e.target.value)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm w-32"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
          </select>
        </div>
        <Button size="sm" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Buscar
        </Button>
      </div>

      {sales.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-lg">Nenhuma venda encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Finalizado em</TableHead>
              <TableHead>Troco</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>{s.seller.name}</TableCell>
                <TableCell>{s.client?.name ?? s.customerName ?? '—'}</TableCell>
                <TableCell>
                  {s.paymentMethod
                    ? <Badge variant="outline">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge>
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {s.finalizedAt
                    ? new Date(s.finalizedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </TableCell>
                <TableCell className="text-sm">
                  {s.change != null ? (
                    <span className="text-green-600 font-medium">{fmt(s.change)}</span>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === 'PAID' ? 'default' : 'secondary'}>
                    {s.status === 'PAID' ? 'Pago' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{fmt(s.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bold }: {
  icon: React.ElementType; label: string; value: string; color: string; bold?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {label}
      </div>
      <p className={`text-lg ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>{value}</p>
    </div>
  );
}
