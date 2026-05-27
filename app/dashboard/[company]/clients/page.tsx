'use client';

import { useEffect, useState } from 'react';
import { UserCircle, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { DataPagination } from '@/components/data-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { normalizePaged } from '@/lib/paginate';
import { ClientDialog } from './client-dialog';
import { History, CreditCard, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

type Client = {
  id: string; name: string; cpf: string | null; phone: string | null;
  email: string | null; address: string | null; active: boolean; createdAt: string;
};

type Payment  = { id: string; amount: number; paymentMethod: string; createdAt: string };
type SaleItem = { id: string; quantity: number; price: number; product: { name: string } };
type Sale = {
  id: string; total: number; amountPaid: number; remainingAmount: number | null;
  status: string; paymentMethod: string | null; dueDate: string | null;
  createdAt: string; finalizedAt: string | null; paidAt: string | null;
  seller: { name: string }; items: SaleItem[]; payments: Payment[];
};

const LIMIT = 20;

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtQty = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};
const PM_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', DEBIT: 'Débito', CREDIT_CARD: 'Cartão', CREDIT: 'A Prazo',
};
const STATUS_LABEL:   Record<string, string>                                = { PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Atrasado' };
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary', PAID: 'default', OVERDUE: 'destructive',
};

function PayModal({ sale, onClose, onPaid }: { sale: Sale | null; onClose: () => void; onPaid: (updated: Sale) => void }) {
  const remaining = sale ? (sale.remainingAmount ?? sale.total) : 0;
  const [amount, setAmount]   = useState('');
  const [method, setMethod]   = useState<'CASH' | 'DEBIT' | 'CREDIT_CARD'>('CASH');
  const [error, setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sale) { setAmount(remaining.toFixed(2)); setMethod('CASH'); setError(''); }
  }, [sale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Valor deve ser maior que 0'); return; }
    if (amt > remaining + 0.01) { setError(`Valor não pode exceder ${fmt(remaining)}`); return; }
    setError('');
    setIsLoading(true);
    try {
      const updated = await api.post<Sale>(`/sales/${sale!.id}/pay`, { amount: amt, paymentMethod: method });
      onPaid(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={!!sale} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
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
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'DEBIT', 'CREDIT_CARD'] as const).map((pm) => (
                  <Button key={pm} type="button" size="sm"
                    variant={method === pm ? 'default' : 'outline'}
                    onClick={() => setMethod(pm)} className="text-xs">
                    {PM_LABELS[pm]}
                  </Button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Salvando...</> : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreditModal({ open, onClose, title, clientId }: { open: boolean; onClose: () => void; title: string; clientId: string }) {
  const [sales, setSales]         = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paying, setPaying]       = useState<Sale | null>(null);

  async function loadSales() {
    setIsLoading(true);
    try { setSales(await api.get<Sale[]>(`/clients/${clientId}/credit`)); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { if (open) loadSales(); }, [open, clientId]);

  function handlePaid(updated: Sale) {
    setSales((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setPaying(null);
  }

  const totalRemaining = sales
    .filter((s) => s.status !== 'PAID')
    .reduce((acc, s) => acc + (s.remainingAmount ?? s.total), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0 bg-muted/20">
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            {!isLoading && sales.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Saldo total em aberto:{' '}
                <strong className={totalRemaining > 0 ? 'text-destructive' : 'text-green-600'}>
                  {fmt(totalRemaining)}
                </strong>
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {isLoading ? (
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
                  <div key={s.id} className={`rounded-xl border p-4 space-y-3 transition-colors ${isOverdue ? 'border-destructive/40 bg-destructive/5' : isPaid ? 'bg-muted/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'}>
                          {isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {isPaid    && <CheckCircle2  className="h-3 w-3 mr-1" />}
                          {!isOverdue && !isPaid && <Clock className="h-3 w-3 mr-1" />}
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground">Vendedor: <strong className="text-foreground">{s.seller.name}</strong></span>
                      </div>
                      {!isPaid && (
                        <Button size="sm" variant={isOverdue ? 'destructive' : 'default'} onClick={() => setPaying(s)}>
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
                        <p className={`font-semibold tabular-nums ${isPaid ? '' : 'text-destructive'}`}>{fmt(remaining)}</p>
                      </div>
                    </div>
                    {s.dueDate && (
                      <p className={`text-xs ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {isOverdue ? '⚠ Vencido em ' : 'Vence em '}
                        <strong>{new Date(s.dueDate).toLocaleDateString('pt-BR')}</strong>
                        {isPaid && s.paidAt && <span className="ml-3 text-green-600">· Quitado em {new Date(s.paidAt).toLocaleDateString('pt-BR')}</span>}
                      </p>
                    )}
                    {s.payments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Histórico de pagamentos</p>
                          {s.payments.map((p) => (
                            <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>{new Date(p.createdAt).toLocaleDateString('pt-BR')} · {PM_LABELS[p.paymentMethod] ?? p.paymentMethod}</span>
                              <span className="font-medium text-green-600 tabular-nums">+ {fmt(p.amount)}</span>
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

function HistoryModal({ open, onClose, title, clientId }: { open: boolean; onClose: () => void; title: string; clientId: string }) {
  const [sales, setSales]         = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    api.get<Sale[]>(`/clients/${clientId}/history`)
      .then(setSales)
      .finally(() => setIsLoading(false));
  }, [open, clientId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
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
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'secondary'}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
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
  const [clients, setClients]       = useState<Client[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isLoading, setIsLoading]   = useState(true);
  const [editOpen, setEditOpen]     = useState(false);
  const [editing, setEditing]       = useState<Client | null>(null);
  const [creditClient, setCreditClient]   = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function load(searchTerm: string, targetPage: number, active: string) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm) params.set('search', searchTerm);
    if (active)     params.set('active', active);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: Client[]; total: number } | Client[]>(`/clients?${params}`),
      );
      setClients(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { setPage(1); }, [debouncedSearch, activeFilter]);
  useEffect(() => { load(debouncedSearch, page, activeFilter); }, [debouncedSearch, page, activeFilter]);

  function handleOpenCreate() {
    setEditing(null);
    setEditOpen(true);
  }

  function handleOpenEdit(client: Client) {
    setEditing(client);
    setEditOpen(true);
  }

  function handleSuccess() {
    setEditOpen(false);
    load(debouncedSearch, page, activeFilter);
  }

  const filterContent = (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Status
      </Label>
      <select
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">Todos</option>
        <option value="true">Ativos</option>
        <option value="false">Inativos</option>
      </select>
    </div>
  );

  return (
    <div>
      <PageHeader
        icon={UserCircle}
        title="Clientes"
        description="Consulte e gerencie os clientes"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo cliente
          </Button>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, telefone, CPF ou email..."
        filterContent={filterContent}
        isFilterActive={!!activeFilter}
        onClearFilters={() => setActiveFilter('')}
      />

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
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{client.cpf ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{client.email ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={client.active ? 'default' : 'secondary'}>
                  {client.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(client.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setHistoryClient(client)}>
                    <History className="h-3.5 w-3.5 mr-1" />
                    Histórico
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCreditClient(client)}>
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    A Prazo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(client)}>
                    Editar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />

      <ClientDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={handleSuccess}
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
