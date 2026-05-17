'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tag, Barcode, Percent, Plus, Trash2, Pencil } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL;

type Category = { id: string; name: string };
type Discount = {
  id: string; percent: number; startDate: string; endDate: string | null; active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  categoryId: string | null;
  category: Category | null;
  discounts: Discount[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  categories: Category[];
};

function clampMoney(val: string, min = 0.01, max = 999999.99): string {
  const n = parseFloat(val);
  if (isNaN(n) || n < min) return String(min);
  if (n > max) return String(max);
  return String(Math.round(n * 100) / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function ProductDialog({ open, onClose, onSuccess, product, categories }: Props) {
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [barcode, setBarcode]     = useState('');
  const [price, setPrice]         = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock]         = useState('');
  const [imageUrl, setImageUrl]   = useState('');
  const [imagePreview, setPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [discountTab, setDiscountTab] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setDiscountTab(false); return; }
    if (product) {
      setName(product.name);
      setDesc(product.description ?? '');
      setBarcode(product.barcode ?? '');
      setPrice(String(product.price));
      setCostPrice(product.costPrice != null ? String(product.costPrice) : '');
      setStock(String(product.stock));
      setImageUrl(product.imageUrl ?? '');
      setPreview(product.imageUrl ?? null);
      setCategoryId(product.categoryId ?? '');
      setDiscounts(product.discounts ?? []);
    } else {
      setName(''); setDesc(''); setBarcode(''); setPrice(''); setCostPrice('');
      setStock(''); setImageUrl(''); setPreview(null); setCategoryId('');
      setDiscounts([]);
    }
    setError('');
    setDiscountTab(false);
    if (fileRef.current) fileRef.current.value = '';
  }, [product, open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error('Erro ao fazer upload da imagem');
      const data = await res.json() as { url: string };
      setImageUrl(data.url);
      setPreview(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const parsedCost = costPrice.trim() !== '' ? parseFloat(costPrice) : undefined;
      const payload = {
        name,
        description:  description || undefined,
        barcode:      barcode.trim() || undefined,
        price:        parseFloat(price),
        costPrice:    parsedCost,
        stock:        parseInt(stock, 10),
        imageUrl:     imageUrl || undefined,
        categoryId:   categoryId || null,
      };
      if (product) {
        await api.put(`/products/${product.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  const priceVal = parseFloat(price)     || 0;
  const costVal  = parseFloat(costPrice) || 0;
  const margin   = priceVal > 0 && costVal > 0 ? ((priceVal - costVal) / priceVal) * 100 : null;

  async function refreshDiscounts() {
    if (!product) return;
    const list = await api.get<Discount[]>(`/products/${product.id}/discounts`).catch(() => []);
    setDiscounts(list);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>

        {/* Tab switcher (only for existing products) */}
        {product && (
          <div className="flex gap-1 border-b mb-1">
            <button
              onClick={() => setDiscountTab(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${!discountTab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Dados
            </button>
            <button
              onClick={() => { setDiscountTab(true); refreshDiscounts(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${discountTab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Percent className="h-3.5 w-3.5" />
              Descontos
              {discounts.filter((d) => d.active).length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {discounts.filter((d) => d.active).length}
                </Badge>
              )}
            </button>
          </div>
        )}

        {!discountTab ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input required value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={description} maxLength={300} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Categoria</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5"><Barcode className="h-3.5 w-3.5" />Código de barras</Label>
                <Input
                  value={barcode}
                  maxLength={100}
                  placeholder="Escanear ou digitar"
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Preço de venda (R$)</Label>
                <Input
                  required type="number" step="0.01" min="0.01" max="999999.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={(e) => setPrice(clampMoney(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Preço de custo (R$)
                  <span className="ml-1 text-xs text-muted-foreground font-normal">opcional</span>
                </Label>
                <Input
                  type="number" step="0.01" min="0.01" max="999999.99" placeholder="0,00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  onBlur={(e) => { if (e.target.value) setCostPrice(clampMoney(e.target.value)); }}
                />
              </div>
            </div>

            {margin !== null && (
              <div className={`text-xs font-medium rounded-lg px-3 py-2 ${
                margin >= 20 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                : margin >= 10 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'
                : 'bg-red-50 text-red-700 dark:bg-red-950/30'
              }`}>
                Margem estimada: {margin.toFixed(1)}%
                {' · '}Lucro por unidade: R$ {(priceVal - costVal).toFixed(2)}
              </div>
            )}

            <div className="space-y-1">
              <Label>Estoque</Label>
              <Input
                required type="number" min="0" max="99999" step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onBlur={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setStock(String(isNaN(n) || n < 0 ? 0 : Math.min(n, 99999)));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem</Label>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded object-cover" />
              )}
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
              {uploading && <p className="text-sm text-muted-foreground">Enviando imagem...</p>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <DiscountsPanel productId={product!.id} discounts={discounts} onRefresh={refreshDiscounts} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Discounts Panel ──────────────────────────────────────────────────────────

function DiscountsPanel({
  productId, discounts, onRefresh,
}: {
  productId: string;
  discounts: Discount[];
  onRefresh: () => void;
}) {
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [error, setError]     = useState('');

  async function handleDelete(id: string) {
    try {
      await api.delete(`/products/discounts/${id}`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  }

  async function toggleActive(d: Discount) {
    try {
      await api.put(`/products/discounts/${d.id}`, { active: !d.active });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  }

  const now = new Date();

  function discountStatus(d: Discount) {
    const start = new Date(d.startDate);
    const end   = d.endDate ? new Date(d.endDate) : null;
    if (!d.active) return { label: 'Inativo', cls: 'text-muted-foreground bg-muted' };
    if (start > now) return { label: 'Agendado', cls: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30' };
    if (end && end < now) return { label: 'Expirado', cls: 'text-muted-foreground bg-muted' };
    return { label: 'Ativo', cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30' };
  }

  if (adding || editing) {
    return (
      <DiscountForm
        productId={productId}
        discount={editing}
        onSaved={() => { setAdding(false); setEditing(null); onRefresh(); }}
        onCancel={() => { setAdding(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        {discounts.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-6 border rounded-lg">
            Nenhum desconto cadastrado.
          </p>
        )}
        {discounts.map((d) => {
          const st = discountStatus(d);
          return (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
              <span className="font-bold tabular-nums text-primary">{d.percent}%</span>
              <span className="text-xs text-muted-foreground flex-1">
                {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : 'sem fim'}
              </span>
              <button
                onClick={() => setEditing(d)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(d.id)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />Novo desconto
      </Button>
    </div>
  );
}

// ─── Discount Form ────────────────────────────────────────────────────────────

function DiscountForm({
  productId, discount, onSaved, onCancel,
}: {
  productId: string;
  discount: Discount | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [percent, setPercent]     = useState(discount ? String(discount.percent) : '');
  const [startDate, setStart]     = useState(discount ? discount.startDate.split('T')[0] : '');
  const [endDate, setEnd]         = useState(discount?.endDate ? discount.endDate.split('T')[0] : '');
  const [noEnd, setNoEnd]         = useState(!discount?.endDate);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSave() {
    if (!percent || !startDate) { setError('Preencha percentual e data de início'); return; }
    const pct = parseFloat(percent);
    if (isNaN(pct) || pct <= 0 || pct > 100) { setError('Percentual deve ser entre 0.01 e 100'); return; }
    setError(''); setLoading(true);
    try {
      const body = {
        percent: pct,
        startDate,
        endDate: noEnd ? undefined : (endDate || undefined),
        active: true,
      };
      if (discount) {
        await api.put(`/products/discounts/${discount.id}`, { ...body, endDate: noEnd ? null : (endDate || null) });
      } else {
        await api.post(`/products/${productId}/discounts`, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">{discount ? 'Editar desconto' : 'Novo desconto'}</h3>
      <div className="space-y-1">
        <Label>Percentual de desconto (%)</Label>
        <Input
          type="number" min="0.01" max="100" step="0.01" placeholder="ex: 10"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          onBlur={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) setPercent(String(Math.min(Math.max(n, 0.01), 100)));
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Data de início</Label>
          <Input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Data de fim</Label>
          <Input
            type="date" value={endDate}
            onChange={(e) => setEnd(e.target.value)}
            disabled={noEnd}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={noEnd} onChange={(e) => setNoEnd(e.target.checked)} className="rounded" />
        Sem data de fim (desconto permanente)
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
