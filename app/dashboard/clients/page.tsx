'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ClientDialog } from './client-dialog';
import { History, CreditCard, RefreshCw, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';

type Client = {
  id: string; name: string; cpf: string | null; phone: string | null;
  email: string | null; address: string | null; active: boolean; createdAt: string;
};

type Payment = { id: string; amount: number; paymentMethod: string; createdAt: string };
type SaleItem = { id: string; quantity: number; price: number; product: { name: string } };
type Sale = {
  id: string; total: number; amountPaid: number; remainingAmount: number | null;
  status: string; paymentMethod: string | null; dueDate: string | null;
  createdAt: string; finalizedAt: string | null; paidAt: string | null;
  seller: { name: string }; items: SaleItem[]; payments: Payment[];
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtQty = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};
const PM_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', DEBIT: 'Débito', CREDIT_CARD: 'Cartão', CREDIT: 'A Prazo',
};
const STATUS_LABEL: Record<string, string>  = { PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Atrasado' };
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary', PAID: 'default', OVERDUE: 'destructive',
};

function PayModal({
  sale, onClose, onPaid,
}: {
  sale: Sale | null;
  onClose: () => void;
  onPaid: (updated: Sale) => void;
}) {
  const remaining = sale ? (sale.remainingAmount ?? sale.total) : 0;
  const [amount, setAmount]   = useState('');
  const [method, setMethod]   = useState<'CASH' | 'DEBIT' | 'CREDIT_CARD'>('CASH');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sale) { setAmount(remaining.toFixed(2)); setMethod('CASH'); setError(''); }
  }, [sale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Valor deve ser maior que 0'); return; }
    if (amt > remaining + 0.01) { setError(`Valor não pode exceder ${fmt(remaining)}`); return; }
    setError('');
    setLoading(true);
    try {
      const updated = await api.post<Sale>(`/sales/${sale!.id}/pay`, { amount: amt, paymentMethod: method });
      onPaid(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!sale} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        {sale && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-muted/40 border px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total da venda</span>
                <span className="tabular-nums">{fmt(sale.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Já pago</span>
                <span className="tabular-nums text-green-600 font-medium">{fmt(sale.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Saldo restante</span>
                <span className="tabular-nums text-destructive">{fmt(remaining)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Valor a pagar <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                <Input
                  type="number" min="0.01" step="0.01" max={remaining}
                  required className="pl-10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pagamento <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'DEBIT', 'CREDIT_CARD'] as const).map((pm) => (
                  <Button
                    key={pm} type="button" size="sm"
                    variant={method === pm ? 'default' : 'outline'}
                    onClick={() => setMethod(pm)}
                    className="text-xs"
                  >
                    {PM_LABELS[pm]}
                  </Button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Salvando...</> : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreditModal({
  open, onClose, title, clientId,
}: {
  open: boolean; onClose: () => void; title: string; clientId: string;
}) {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying]   = useState<Sale | null>(null);

  async function load() {
    setLoading(true);
    try { setSales(await api.get<Sale[]>(`/clients/${clientId}/credit`)); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) load(); }, [open, clientId]);

  function handlePaid(updated: Sale) {
    setSales((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setPaying(null);
  }

  const totalRemaining = sales
    .filter((s) => s.status !== 'PAID')
    .reduce((a, s) => a + (s.remainingAmount ?? s.total), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0 bg-muted/20">
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            {!loading && sales.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Saldo total em aberto:{' '}
                <strong className={totalRemaining > 0 ? 'text-destructive' : 'text-green-600'}>
                  {fmt(totalRemaining)}
                </strong>
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <CreditCard className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhuma venda a prazo encontrada.</p>
              </div>
            ) : (
              sales.map((s) => {
                const remaining = s.remainingAmount ?? s.total;
                const isOverdue = s.status === 'OVERDUE';
                const isPaid    = s.status === 'PAID';

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isOverdue ? 'border-destructive/40 bg-destructive/5' : isPaid ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'}>
                          {isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {isPaid    && <CheckCircle2  className="h-3 w-3 mr-1" />}
                          {!isOverdue && !isPaid && <Clock className="h-3 w-3 mr-1" />}
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Vendedor: <strong className="text-foreground">{s.seller.name}</strong>
                        </span>
                      </div>
                      {!isPaid && (
                        <Button
                          size="sm"
                          variant={isOverdue ? 'destructive' : 'default'}
                          onClick={() => setPaying(s)}
                        >
                          Pagar
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                        <p className="font-semibold tabular-nums">{fmt(s.total)}</p>
                      </div>
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Pago</p>
                        <p className="font-semibold tabular-nums text-green-600">{fmt(s.amountPaid)}</p>
                      </div>
                      <div className={`rounded-lg px-3 py-2 ${isPaid ? 'bg-muted/50' : 'bg-destructive/10'}`}>
                        <p className="text-xs text-muted-foreground mb-0.5">Restante</p>
                        <p className={`font-semibold tabular-nums ${isPaid ? '' : 'text-destructive'}`}>
                          {fmt(remaining)}
                        </p>
                      </div>
                    </div>

                    {s.dueDate && (
                      <p className={`text-xs ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {isOverdue ? '⚠ Vencido em ' : 'Vence em '}
                        <strong>{new Date(s.dueDate).toLocaleDateString('pt-BR')}</strong>
                        {isPaid && s.paidAt && (
                          <span className="ml-3 text-green-600">
                            · Quitado em {new Date(s.paidAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </p>
                    )}

                    {s.payments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            Histórico de pagamentos
                          </p>
                          {s.payments.map((p) => (
                            <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                                {' · '}{PM_LABELS[p.paymentMethod] ?? p.paymentMethod}
                              </span>
                              <span className="font-medium text-green-600 tabular-nums">
                                + {fmt(p.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="space-y-0.5">
                      {s.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.product.name} × {fmtQty(item.quantity)}</span>
                          <span className="tabular-nums">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PayModal sale={paying} onClose={() => setPaying(null)} onPaid={handlePaid} />
    </>
  );
}

function HistoryModal({
  open, onClose, title, clientId,
}: {
  open: boolean; onClose: () => void; title: string; clientId: string;
}) {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<Sale[]>(`/clients/${clientId}/history`)
      .then(setSales)
      .finally(() => setLoading(false));
  }, [open, clientId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : sales.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">Nenhum registro.</p>
          ) : (
            sales.map((s) => (
              <div key={s.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                    {s.paymentMethod && (
                      <span className="text-xs border rounded px-2 py-0.5 text-muted-foreground">
                        {PM_LABELS[s.paymentMethod] ?? s.paymentMethod}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-primary tabular-nums">{fmt(s.total)}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>Data: <strong className="text-foreground">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</strong></span>
                  <span>Vendedor: <strong className="text-foreground">{s.seller.name}</strong></span>
                  {s.dueDate && (
                    <span className={s.status === 'OVERDUE' ? 'text-destructive font-semibold' : ''}>
                      Vencimento: <strong>{new Date(s.dueDate).toLocaleDateString('pt-BR')}</strong>
                    </span>
                  )}
                </div>
                <Separator />
                {s.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.name} × {fmtQty(item.quantity)}</span>
                    <span className="text-muted-foreground tabular-nums">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsPage() {
  const [clients, setClients]   = useState<Client[]>([]);
  const [search, setSearch]     = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing]   = useState<Client | null>(null);

  const [creditClient, setCreditClient]   = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  async function load() {
    setClients(await api.get<Client[]>('/clients'));
  }

  useEffect(() => { load(); }, []);

  const filtered = search.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.cpf?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : clients;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => { setEditing(null); setEditOpen(true); }}>Novo cliente</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, CPF ou email..."
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</td></tr>
          )}
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{c.cpf ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{c.email ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={c.active ? 'default' : 'secondary'}>
                  {c.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(c.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setHistoryClient(c)}>
                    <History className="h-3.5 w-3.5 mr-1" />
                    Histórico
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCreditClient(c)}>
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    A Prazo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setEditOpen(true); }}>
                    Editar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ClientDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); }}
        client={editing}
      />

      {creditClient && (
        <CreditModal
          open
          onClose={() => setCreditClient(null)}
          title={`Contas a Prazo — ${creditClient.name}`}
          clientId={creditClient.id}
        />
      )}

      {historyClient && (
        <HistoryModal
          open
          onClose={() => setHistoryClient(null)}
          title={`Histórico — ${historyClient.name}`}
          clientId={historyClient.id}
        />
      )}
    </div>
  );
}
