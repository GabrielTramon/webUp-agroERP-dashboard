'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt    = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtQty = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};
const fmtDt  = (s: string) => new Date(s).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  hour: '2-digit', minute: '2-digit',
});

type Product = { id: string; name: string; price: number; costPrice: number | null };

type PriceHistory = {
  id: string;
  oldPrice: number;
  newPrice: number;
  oldCostPrice: number | null;
  newCostPrice: number | null;
  changedAt: string;
  changedBy: { id: string; name: string };
};

type SaleHistoryItem = {
  id: string;
  quantity: number;
  price: number;
  costPrice: number | null;
  subtotal: number;
  sale: {
    id: string;
    createdAt: string;
    status: string;
    seller: { id: string; name: string };
    client: { id: string; name: string } | null;
  };
};

type Props = {
  product: Product | null;
  onClose: () => void;
};

export function ProductHistoryDialog({ product, onClose }: Props) {
  const [tab, setTab]               = useState<'prices' | 'sales'>('prices');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [priceHistory, setPH]       = useState<PriceHistory[]>([]);
  const [salesHistory, setSH]       = useState<SaleHistoryItem[]>([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!product) return;
    setTab('prices');
    setFrom(''); setTo('');
    setPH([]); setSH([]);
    loadPrices(product.id, '', '');
  }, [product]);

  async function loadPrices(id: string, f: string, t: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      setPH(await api.get<PriceHistory[]>(`/products/${id}/price-history?${params}`));
    } catch { setPH([]); } finally { setLoading(false); }
  }

  async function loadSales(id: string, f: string, t: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      setSH(await api.get<SaleHistoryItem[]>(`/products/${id}/sales-history?${params}`));
    } catch { setSH([]); } finally { setLoading(false); }
  }

  function handleSearch() {
    if (!product) return;
    if (tab === 'prices') loadPrices(product.id, from, to);
    else loadSales(product.id, from, to);
  }

  function switchTab(t: 'prices' | 'sales') {
    setTab(t);
    if (!product) return;
    if (t === 'prices') loadPrices(product.id, from, to);
    else loadSales(product.id, from, to);
  }

  const totalSalesQty = salesHistory.reduce((a, s) => a + s.quantity, 0);
  const totalRevenue  = salesHistory.reduce((a, s) => a + s.subtotal, 0);
  const totalCost     = salesHistory.reduce((a, s) => a + (s.costPrice ?? 0) * s.quantity, 0);
  const totalProfit   = totalRevenue - totalCost;

  return (
    <Dialog open={!!product} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="text-lg">
            Histórico — <span className="font-normal text-muted-foreground">{product?.name}</span>
          </DialogTitle>
          <div className="flex items-center gap-1 mt-2">
            {(['prices', 'sales'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                  tab === t
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {t === 'prices' ? 'Histórico de preços' : 'Histórico de vendas'}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex items-end gap-3 px-6 py-3 border-b bg-muted/20 shrink-0">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" className="h-8 text-sm w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" className="h-8 text-sm w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={handleSearch} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
            Buscar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'prices' && (
            <>
              {priceHistory.length === 0 && !loading ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Nenhuma alteração de preço registrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Preço anterior</TableHead>
                      <TableHead className="text-right">Preço novo</TableHead>
                      <TableHead className="text-right">Custo anterior</TableHead>
                      <TableHead className="text-right">Custo novo</TableHead>
                      <TableHead className="text-center">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.map((h) => {
                      const diff = h.newPrice - h.oldPrice;
                      return (
                        <TableRow key={h.id}>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {fmtDt(h.changedAt)}
                          </TableCell>
                          <TableCell className="font-medium">{h.changedBy.name}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {fmt(h.oldPrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {fmt(h.newPrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {h.oldCostPrice != null ? fmt(h.oldCostPrice) : '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {h.newCostPrice != null ? fmt(h.newCostPrice) : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {diff > 0 ? (
                              <span className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium">
                                <TrendingUp className="h-3.5 w-3.5" />+{fmt(diff)}
                              </span>
                            ) : diff < 0 ? (
                              <span className="flex items-center justify-center gap-1 text-destructive text-xs font-medium">
                                <TrendingDown className="h-3.5 w-3.5" />{fmt(diff)}
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                                <Minus className="h-3.5 w-3.5" />Apenas custo
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {tab === 'sales' && (
            <>
              {salesHistory.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Qtd vendida',   value: `${fmtQty(totalSalesQty)} un` },
                      { label: 'Receita total',  value: fmt(totalRevenue) },
                      { label: 'Custo total',    value: fmt(totalCost) },
                      { label: 'Lucro total',    value: fmt(totalProfit),
                        className: totalProfit >= 0 ? 'text-emerald-600' : 'text-destructive' },
                    ].map(({ label, value, className }) => (
                      <div key={label} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className={cn('text-sm font-semibold tabular-nums', className)}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="mb-4" />
                </>
              )}

              {salesHistory.length === 0 && !loading ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Nenhuma venda encontrada para este produto.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço unit.</TableHead>
                      <TableHead className="text-right">Custo unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.map((item) => {
                      const itemCost   = (item.costPrice ?? 0) * item.quantity;
                      const itemProfit = item.subtotal - itemCost;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {fmtDt(item.sale.createdAt)}
                          </TableCell>
                          <TableCell>{item.sale.seller.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.sale.client?.name ?? '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{fmtQty(item.quantity)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(item.price)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {item.costPrice != null ? fmt(item.costPrice) : '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {fmt(item.subtotal)}
                          </TableCell>
                          <TableCell className={cn(
                            'text-right tabular-nums font-semibold',
                            item.costPrice != null
                              ? itemProfit >= 0 ? 'text-emerald-600' : 'text-destructive'
                              : 'text-muted-foreground',
                          )}>
                            {item.costPrice != null ? fmt(itemProfit) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.sale.status === 'PAID' ? 'default' : 'secondary'}>
                              {item.sale.status === 'PAID' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
