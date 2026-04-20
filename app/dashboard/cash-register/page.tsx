'use client';

import { useEffect, useState } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  LockOpen, Lock, RefreshCw, TrendingUp, Clock, CheckCircle, Banknote, CreditCard,
} from 'lucide-react';

type Seller  = { id: string; name: string };
type Client  = { id: string; name: string } | null;
type SaleItem = { id: string; quantity: number; price: number; subtotal: number; product: { id: string; name: string } };
type Sale = {
  id: string;
  total: number;
  discount: number;
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'CREDIT' | null;
  status: 'PAID' | 'PENDING';
  customerName: string | null;
  client: Client;
  seller: Seller;
  items: SaleItem[];
  createdAt: string;
  finalizedAt: string | null;
};
type Summary = {
  cashTotal: number;
  debitTotal: number;
  creditCardTotal: number;
  creditTotal: number;
  paidTotal: number;
  pendingTotal: number;
  grandTotal: number;
  totalSales: number;
};
type CashRegister = {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  openedBy: Seller;
  closedBy: Seller | null;
  sales: Sale[];
  summary: Summary;
};
type FinalizeForm = {
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'CREDIT';
  clientId: string;
  customerName: string;
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  DEBIT: 'Débito',
  CREDIT_CARD: 'Cartão',
  CREDIT: 'A Prazo',
};

export default function CashRegisterPage() {
  const [register, setRegister]         = useState<CashRegister | null>(null);
  const [pending, setPending]           = useState<Sale[]>([]);
  const [clients, setClients]           = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState(false);
  const [error, setError]               = useState('');
  const [finalizing, setFinalizing]     = useState<Sale | null>(null);
  const [form, setForm]                 = useState<FinalizeForm>({
    paymentMethod: 'CASH',
    clientId: '',
    customerName: '',
  });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [reg, pend, cls] = await Promise.all([
        api.get<CashRegister | null>('/cash-register/current'),
        api.get<Sale[]>('/cash-register/pending-sales'),
        api.get<{ id: string; name: string }[]>('/clients'),
      ]);
      setRegister(reg);
      setPending(pend);
      setClients(cls);
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
    try {
      await api.post('/cash-register/open', {});
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao abrir caixa');
    } finally {
      setActing(false);
    }
  }

  async function handleClose() {
    if (!confirm('Fechar o caixa? Esta ação não pode ser desfeita.')) return;
    setActing(true);
    setError('');
    try {
      const closed = await api.post<CashRegister>('/cash-register/close', {});
      setRegister(closed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao fechar caixa');
    } finally {
      setActing(false);
    }
  }

  function openFinalizeModal(sale: Sale) {
    setForm({ paymentMethod: 'CASH', clientId: sale.client?.id ?? '', customerName: sale.customerName ?? '' });
    setFinalizing(sale);
  }

  async function handleFinalize() {
    if (!finalizing) return;
    if (form.paymentMethod === 'CREDIT' && !form.clientId) {
      setError('Selecione um cliente para venda a prazo');
      return;
    }
    setActing(true);
    setError('');
    try {
      await api.post(`/cash-register/finalize/${finalizing.id}`, {
        paymentMethod: form.paymentMethod,
        clientId: form.paymentMethod === 'CREDIT' ? form.clientId : undefined,
        customerName: form.customerName || undefined,
      });
      setFinalizing(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao finalizar venda');
    } finally {
      setActing(false);
    }
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
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Caixa</h1>
          <Badge variant={isOpen ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {register ? (isOpen ? 'ABERTO' : 'FECHADO') : 'SEM CAIXA'}
          </Badge>
        </div>
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

      {/* info do caixa */}
      {register && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
          <span>Aberto por: <strong className="text-foreground">{register.openedBy.name}</strong></span>
          <span>Em: <strong className="text-foreground">{new Date(register.openedAt).toLocaleString('pt-BR')}</strong></span>
          {register.closedBy && (
            <span>Fechado por: <strong className="text-foreground">{register.closedBy.name}</strong></span>
          )}
          {register.closedAt && (
            <span>Em: <strong className="text-foreground">{new Date(register.closedAt).toLocaleString('pt-BR')}</strong></span>
          )}
        </div>
      )}

      {!register && !loading && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-3">
          <Lock className="h-10 w-10 opacity-30" />
          <p className="text-sm">Nenhum caixa aberto. Clique em "Abrir Caixa" para começar.</p>
        </div>
      )}

      {/* vendas pendentes */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          Vendas Pendentes
          <Badge variant="secondary">{pending.length}</Badge>
          {!isOpen && pending.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-1">— abra o caixa para finalizar</span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
            Nenhuma venda pendente.
          </p>
        ) : (
          <Table>
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
                    <Button
                      size="sm"
                      onClick={() => openFinalizeModal(s)}
                      disabled={!isOpen}
                    >
                      Finalizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {register && (
        <>
          <Separator />

          {/* resumo financeiro */}
          <div>
            <h2 className="font-semibold mb-3">Resumo do Caixa</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <SummaryCard icon={Banknote}   label="Dinheiro"  value={fmt(register.summary.cashTotal)}       color="text-blue-600" />
              <SummaryCard icon={CreditCard} label="Débito"    value={fmt(register.summary.debitTotal)}      color="text-indigo-600" />
              <SummaryCard icon={CreditCard} label="Cartão"    value={fmt(register.summary.creditCardTotal)} color="text-purple-600" />
              <SummaryCard icon={Clock}      label="A Prazo"   value={fmt(register.summary.creditTotal)}     color="text-orange-600" />
              <SummaryCard icon={CheckCircle} label="Pago"     value={fmt(register.summary.paidTotal)}       color="text-green-600" />
              <SummaryCard icon={TrendingUp} label="Total"     value={fmt(register.summary.grandTotal)}      color="text-foreground" bold />
            </div>
          </div>

          <Separator />

          {/* vendas finalizadas no caixa */}
          <div>
            <h2 className="font-semibold mb-3">
              Vendas Finalizadas
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({register.summary.totalSales} venda{register.summary.totalSales !== 1 ? 's' : ''})
              </span>
            </h2>

            {register.sales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma venda finalizada neste caixa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {register.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.finalizedAt
                          ? new Date(s.finalizedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </TableCell>
                      <TableCell>{s.seller.name}</TableCell>
                      <TableCell>{s.client?.name ?? s.customerName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.paymentMethod ? PAYMENT_LABELS[s.paymentMethod] : '—'}
                        </Badge>
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
        </>
      )}

      {/* modal de finalização */}
      <Dialog open={!!finalizing} onOpenChange={(open) => { if (!open) setFinalizing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>

          {finalizing && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted px-4 py-3 text-sm space-y-1">
                <p className="font-medium">{finalizing.seller.name}</p>
                <p className="text-muted-foreground">{finalizing.items.length} item{finalizing.items.length !== 1 ? 's' : ''} · {fmt(finalizing.total)}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'DEBIT', 'CREDIT_CARD', 'CREDIT'] as const).map((pm) => (
                    <Button
                      key={pm}
                      variant={form.paymentMethod === pm ? 'default' : 'outline'}
                      onClick={() => setForm((f) => ({ ...f, paymentMethod: pm }))}
                    >
                      {PAYMENT_LABELS[pm]}
                    </Button>
                  ))}
                </div>
              </div>

              {form.paymentMethod === 'CREDIT' ? (
                <div className="space-y-1.5">
                  <Label>Cliente <span className="text-destructive">*</span></Label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Nome do cliente <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    placeholder="Ex: João da Silva"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizing(null)} disabled={acting}>
              Cancelar
            </Button>
            <Button onClick={handleFinalize} disabled={acting}>
              {acting ? 'Finalizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, color, bold,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bold?: boolean;
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
