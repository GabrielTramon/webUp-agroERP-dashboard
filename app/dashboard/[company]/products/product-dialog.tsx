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
import { Tag, Barcode, Percent, Plus, Trash2, Pencil, Boxes, Star, StarOff } from 'lucide-react';

type Category = { id: string; name: string };
type Discount = {
  id: string; percent: number; startDate: string; endDate: string | null; active: boolean;
};
export type ProductUnit = {
  id: string;
  name: string;
  abbreviation: string | null;
  conversionFactor: number;
  price: number;
  barcode: string | null;
  isBaseUnit: boolean;
  isDefault: boolean;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  baseUnit: string | null;
  imageUrl: string | null;
  active: boolean;
  categoryId: string | null;
  category: Category | null;
  discounts: Discount[];
  units: ProductUnit[];
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
  const [baseUnit, setBaseUnit]   = useState('');
  const [imageUrl, setImageUrl]   = useState('');
  const [imagePreview, setPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState<'data' | 'discounts' | 'units'>('data');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [units, setUnits]         = useState<ProductUnit[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setTab('data'); return; }
    if (product) {
      setName(product.name);
      setDesc(product.description ?? '');
      setBarcode(product.barcode ?? '');
      setPrice(String(product.price));
      setCostPrice(product.costPrice != null ? String(product.costPrice) : '');
      setStock(String(product.stock));
      setBaseUnit(product.baseUnit ?? '');
      setImageUrl(product.imageUrl ?? '');
      setPreview(product.imageUrl ?? null);
      setCategoryId(product.categoryId ?? '');
      setDiscounts(product.discounts ?? []);
      setUnits(product.units ?? []);
    } else {
      setName(''); setDesc(''); setBarcode(''); setPrice(''); setCostPrice('');
      setStock(''); setBaseUnit(''); setImageUrl(''); setPreview(null); setCategoryId('');
      setDiscounts([]); setUnits([]);
    }
    setError('');
    setTab('data');
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
      const res = await fetch('/api/proxy/upload/image', {
        method: 'POST',
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
        stock:        parseFloat(stock.replace(',', '.')),
        baseUnit:     baseUnit.trim() || (product ? null : undefined),
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

  async function refreshUnits() {
    if (!product) return;
    const list = await api.get<ProductUnit[]>(`/products/${product.id}/units`).catch(() => []);
    setUnits(list);
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
              onClick={() => setTab('data')}
              className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${tab === 'data' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Dados
            </button>
            <button
              onClick={() => { setTab('units'); refreshUnits(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${tab === 'units' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Unidades
              {units.filter((u) => u.active).length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {units.filter((u) => u.active).length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => { setTab('discounts'); refreshDiscounts(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${tab === 'discounts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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

        {tab === 'data' ? (
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

            <div className="grid grid-cols-[1fr_120px] gap-4">
              <div className="space-y-1">
                <Label>Estoque</Label>
                <Input
                  required type="text" inputMode="decimal"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onBlur={(e) => {
                    const n = parseFloat(e.target.value.replace(',', '.'));
                    if (isNaN(n) || n < 0) { setStock('0'); return; }
                    setStock(String(Math.min(Math.round(n * 1000) / 1000, 99999)));
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Unidade base
                  <span className="ml-1 text-xs text-muted-foreground font-normal">opcional</span>
                </Label>
                <Input
                  value={baseUnit}
                  maxLength={10}
                  placeholder="kg, un, L"
                  onChange={(e) => setBaseUnit(e.target.value)}
                />
              </div>
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
        ) : tab === 'units' ? (
          <UnitsPanel
            productId={product!.id}
            baseUnit={product!.baseUnit ?? baseUnit}
            units={units}
            onRefresh={refreshUnits}
          />
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

// ─── Units Panel ──────────────────────────────────────────────────────────────

function UnitsPanel({
  productId, baseUnit, units, onRefresh,
}: {
  productId: string;
  baseUnit: string;
  units: ProductUnit[];
  onRefresh: () => void;
}) {
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState<ProductUnit | null>(null);
  const [error, setError]     = useState('');

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta unidade? Se ela já foi usada em vendas, será desativada em vez de removida.')) return;
    try {
      await api.delete(`/products/${productId}/units/${id}`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  }

  if (adding || editing) {
    return (
      <UnitForm
        productId={productId}
        baseUnit={baseUnit}
        unit={editing}
        onSaved={() => { setAdding(false); setEditing(null); onRefresh(); }}
        onCancel={() => { setAdding(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!baseUnit && (
        <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
          Defina a <strong>Unidade base</strong> na aba Dados (ex: kg) — ela aparece nas mensagens
          de estoque e ajuda a entender o fator de conversão das unidades de venda.
        </p>
      )}
      <div className="space-y-2">
        {units.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-6 border rounded-lg">
            Nenhuma unidade cadastrada. Cadastre unidades quando o mesmo produto for vendido em
            embalagens diferentes (ex: saca 30kg, saca 25kg, kg avulso).
          </p>
        )}
        {units.map((u) => {
          const pricePerBase = u.conversionFactor > 0 ? u.price / u.conversionFactor : 0;
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                !u.active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                {u.isDefault && <Star className="h-3.5 w-3.5 text-amber-500" />}
                {u.isBaseUnit && <Boxes className="h-3.5 w-3.5 text-blue-500" />}
                {!u.isDefault && !u.isBaseUnit && <StarOff className="h-3.5 w-3.5 text-muted-foreground/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{u.name}</span>
                  {u.abbreviation && (
                    <span className="text-xs text-muted-foreground">({u.abbreviation})</span>
                  )}
                  {!u.active && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Inativa
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  1 {u.abbreviation || u.name} = {u.conversionFactor} {baseUnit || 'un'} ·{' '}
                  R$ {u.price.toFixed(2)}
                  {baseUnit && u.conversionFactor !== 1 && (
                    <span> · R$ {pricePerBase.toFixed(2)}/{baseUnit}</span>
                  )}
                  {u.barcode && <span> · {u.barcode}</span>}
                </div>
              </div>
              <button
                onClick={() => setEditing(u)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />Nova unidade
      </Button>
    </div>
  );
}

// ─── Unit Form ────────────────────────────────────────────────────────────────

function UnitForm({
  productId, baseUnit, unit, onSaved, onCancel,
}: {
  productId: string;
  baseUnit: string;
  unit: ProductUnit | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName]               = useState(unit?.name ?? '');
  const [abbreviation, setAbbr]       = useState(unit?.abbreviation ?? '');
  const [conversionFactor, setFactor] = useState(unit ? String(unit.conversionFactor) : '');
  const [price, setPrice]             = useState(unit ? String(unit.price) : '');
  const [barcode, setBarcode]         = useState(unit?.barcode ?? '');
  const [isBaseUnit, setIsBase]       = useState(unit?.isBaseUnit ?? false);
  const [isDefault, setIsDefault]     = useState(unit?.isDefault ?? false);
  const [active, setActive]           = useState(unit?.active ?? true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    const factor = parseFloat(conversionFactor.replace(',', '.'));
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(factor) || factor <= 0) { setError('Fator de conversão deve ser maior que 0'); return; }
    if (isNaN(priceNum) || priceNum < 0) { setError('Preço inválido'); return; }
    setError(''); setLoading(true);
    try {
      const body = {
        name:             name.trim(),
        abbreviation:     abbreviation.trim() || (unit ? null : undefined),
        conversionFactor: factor,
        price:            priceNum,
        barcode:          barcode.trim() || (unit ? null : undefined),
        isBaseUnit,
        isDefault,
        active,
      };
      if (unit) {
        await api.put(`/products/${productId}/units/${unit.id}`, body);
      } else {
        await api.post(`/products/${productId}/units`, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const factorNum   = parseFloat(conversionFactor.replace(',', '.')) || 0;
  const priceNum    = parseFloat(price.replace(',', '.')) || 0;
  const pricePerBase = factorNum > 0 ? priceNum / factorNum : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">{unit ? 'Editar unidade' : 'Nova unidade'}</h3>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div className="space-y-1">
          <Label>Nome</Label>
          <Input
            value={name} maxLength={50}
            placeholder="ex: Saca 30kg, Kg avulso"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>
            Abreviação
            <span className="ml-1 text-xs text-muted-foreground font-normal">opcional</span>
          </Label>
          <Input
            value={abbreviation} maxLength={10}
            placeholder="sc30, kg"
            onChange={(e) => setAbbr(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>
            Fator de conversão
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              {baseUnit ? `em ${baseUnit}` : '(unidades-base)'}
            </span>
          </Label>
          <Input
            type="text" inputMode="decimal"
            value={conversionFactor}
            placeholder={baseUnit ? `ex: 30` : 'ex: 30'}
            onChange={(e) => setFactor(e.target.value)}
          />
          {factorNum > 0 && (
            <p className="text-[11px] text-muted-foreground">
              1 {abbreviation || name || 'unidade'} = {factorNum} {baseUnit || 'unidade-base'}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Preço de venda (R$)</Label>
          <Input
            type="number" step="0.01" min="0" max="999999.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          {baseUnit && factorNum > 0 && priceNum > 0 && factorNum !== 1 && (
            <p className="text-[11px] text-muted-foreground tabular-nums">
              R$ {pricePerBase.toFixed(2)}/{baseUnit}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="flex items-center gap-1.5">
          <Barcode className="h-3.5 w-3.5" />Código de barras
          <span className="ml-1 text-xs text-muted-foreground font-normal">opcional</span>
        </Label>
        <Input
          value={barcode} maxLength={100}
          placeholder="Escanear ou digitar"
          onChange={(e) => setBarcode(e.target.value)}
        />
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" className="rounded"
            checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
          />
          <Star className="h-3.5 w-3.5 text-amber-500" />
          Unidade padrão no PDV
          <span className="text-xs text-muted-foreground">(pré-selecionada ao vender)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" className="rounded"
            checked={isBaseUnit} onChange={(e) => setIsBase(e.target.checked)}
          />
          <Boxes className="h-3.5 w-3.5 text-blue-500" />
          Esta é a unidade do estoque
          <span className="text-xs text-muted-foreground">(fator deveria ser 1)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" className="rounded"
            checked={active} onChange={(e) => setActive(e.target.checked)}
          />
          Ativa
        </label>
      </div>

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
