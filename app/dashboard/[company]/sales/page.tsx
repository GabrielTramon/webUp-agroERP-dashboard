'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, Trash2, Plus, Minus, ShoppingCart,
<<<<<<< HEAD:app/dashboard/sales/page.tsx
  History, RefreshCw, Pencil, X, Clock, Banknote,
  Info, ArrowLeft, Tag, Package, ImageOff,
=======
  History, RefreshCw, Pencil, X, Clock, Banknote, AlertTriangle,
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a:app/dashboard/[company]/sales/page.tsx
} from 'lucide-react';
import Link from 'next/link';
import { SearchSelect } from '@/components/ui/search-select';
import { cn } from '@/lib/utils';

type ActiveDiscount = { percent: number; discountedPrice: number };
type Product  = {
  id: string; name: string; price: number; stock: number;
  imageUrl: string | null; active?: boolean; barcode?: string | null;
  description?: string | null;
  costPrice?: number | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  activeDiscount?: ActiveDiscount | null;
};
type Category = { id: string; name: string; description?: string | null; _count?: { products: number } };
type CategoryView =
  | { type: 'categories' }
  | { type: 'all' }
  | { type: 'category'; id: string; name: string };
type Seller   = { id: string; name: string };
type CartItem = { productId: string; name: string; price: number; originalPrice: number; discountPct: number | null; quantity: number; stock: number };
type SaleItem = { id: string; quantity: number; price: number; subtotal: number; product: { id: string; name: string } };
type Sale = {
  id: string; total: number; discount: number;
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'CREDIT' | null;
  status: 'PAID' | 'PENDING'; customerName: string | null;
  client: { id: string; name: string } | null;
  seller: { id: string; name: string };
  items: SaleItem[]; createdAt: string; finalizedAt: string | null;
};
type Client = { id: string; name: string };

const MAX_DISCOUNT = 5;
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtQty = (v: number) => {
  if (!Number.isFinite(v)) return '0';
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};
const parseQty = (raw: string): number => {
  const cleaned = raw.replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

function QtyInput({
  quantity, onChange, className,
}: {
  quantity: number;
  onChange: (raw: string) => void;
  className?: string;
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
      className={cn(
        'w-full h-7 text-center rounded-md border border-input bg-transparent text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring',
        className,
      )}
    />
  );
}
const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', DEBIT: 'Débito', CREDIT_CARD: 'Cartão', CREDIT: 'A Prazo',
};

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'pdv' | 'history'>('pdv');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b pb-3 shrink-0">
        <h1 className="text-2xl font-bold mr-2">Vendas</h1>
        {(['pdv', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {tab === 'pdv'
              ? <><ShoppingCart className="h-3.5 w-3.5" />PDV</>
              : <><History className="h-3.5 w-3.5" />Histórico</>}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 pt-3">
        {activeTab === 'pdv' ? <PdvTab /> : <HistoryTab />}
      </div>
    </div>
  );
}

// ─── PDV Tab ──────────────────────────────────────────────────────────────────

function PdvTab() {
  const { company } = useParams<{ company: string }>();
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [view, setView]                 = useState<CategoryView>({ type: 'categories' });
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [search, setSearch]             = useState('');
  const [discount, setDiscount]         = useState('');
  const [loadingProds, setLoadingProds] = useState(true);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [mobileView, setMobileView]     = useState<'products' | 'cart'>('products');
<<<<<<< HEAD:app/dashboard/sales/page.tsx
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
=======
  const [isCashOpen, setIsCashOpen]     = useState<boolean | null>(null);
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a:app/dashboard/[company]/sales/page.tsx
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadingProds(true);
    Promise.all([
      api.get<Product[]>('/products'),
<<<<<<< HEAD:app/dashboard/sales/page.tsx
      api.get<Category[]>('/products/categories').catch(() => [] as Category[]),
    ])
      .then(([prods, cats]) => {
        setProducts(prods.filter((p) => p.active !== false));
        setCategories(cats);
        if (cats.length === 0) setView({ type: 'all' });
      })
      .catch(() => {})
=======
      api.get<{ status: string } | null>('/cash-register/current'),
    ])
      .then(([prods, reg]) => {
        setProducts(prods.filter((p) => p.active !== false));
        setIsCashOpen(reg?.status === 'OPEN');
      })
      .catch(() => setIsCashOpen(false))
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a:app/dashboard/[company]/sales/page.tsx
      .finally(() => setLoadingProds(false));
  }, []);

  const isSearching = search.trim().length > 0;
  const showCategories = !isSearching && view.type === 'categories' && categories.length > 0;

  const scopedProducts = (() => {
    if (showCategories) return [];
    if (view.type === 'category') {
      return products.filter((p) => p.categoryId === view.id);
    }
    return products;
  })();

  const filtered = isSearching
    ? scopedProducts.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
      )
    : scopedProducts;

  function addToCart(product: Product) {
    if (product.stock === 0) return;
    const effectivePrice = product.activeDiscount?.discountedPrice ?? product.price;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, {
        productId: product.id, name: product.name,
        price: effectivePrice,
        originalPrice: product.price,
        discountPct: product.activeDiscount?.percent ?? null,
        quantity: 1, stock: product.stock,
      }];
    });
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

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = filtered.find((p) => p.stock > 0);
      if (first) { addToCart(first); setSearch(''); }
    } else if (e.key === 'Escape') {
      setSearch('');
      searchRef.current?.blur();
    }
  }

  const gross       = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountPct = Math.min(parseFloat(discount) || 0, MAX_DISCOUNT);
  const discountAmt = gross * (discountPct / 100);
  const total       = gross - discountAmt;

  function handleSuccess() {
    setFinalizeOpen(false);
    setCart([]);
    setDiscount('');
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] min-h-[500px] overflow-hidden">

      {isCashOpen === false && (
        <div className="shrink-0 mb-2 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-medium flex-1">
            Nenhum caixa aberto. Abra o caixa para realizar vendas.
          </span>
          <Link
            href={`/dashboard/${company}/cash-register`}
            className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
          >
            Abrir caixa →
          </Link>
        </div>
      )}

      {/* ── Top bar: busca ── */}
      <div className="shrink-0 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            autoFocus
            className="pl-9 pr-9 h-10"
            placeholder="Buscar produto por nome ou código... (ENTER para adicionar)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile tab switcher ── */}
      <div className="lg:hidden flex gap-2 shrink-0 pb-2">
        <button
          onClick={() => setMobileView('products')}
          className={cn(
            'flex-1 text-sm font-medium py-2 rounded-lg border transition-colors',
            mobileView === 'products'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted border-input',
          )}
        >
          {showCategories ? `Categorias (${categories.length})` : `Produtos (${filtered.length})`}
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={cn(
            'flex-1 text-sm font-medium py-2 rounded-lg border transition-colors',
            mobileView === 'cart'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted border-input',
          )}
        >
          Carrinho {cart.length > 0 ? `(${cart.length})` : ''}
        </button>
      </div>

      {/* ── Main: produtos + carrinho ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-xl border">

        {/* Left: lista de produtos / categorias */}
        <div className={cn(
          'flex flex-col overflow-hidden',
          'lg:w-[44%] lg:border-r',
          mobileView === 'products' ? 'flex-1 border-r-0' : 'hidden lg:flex',
        )}>
          {/* Header: breadcrumb / categoria atual */}
          {!showCategories && categories.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
              <button
                onClick={() => { setView({ type: 'categories' }); setSearch(''); }}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                title="Voltar às categorias"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Categorias
              </button>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-xs font-semibold truncate">
                {view.type === 'category' ? view.name : 'Todos os Produtos'}
              </span>
            </div>
          )}

          {showCategories ? (
            <>
              <div className="flex-1 overflow-y-auto p-3">
                {loadingProds ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setView({ type: 'all' })}
                      className="group flex flex-col items-start justify-between p-3 rounded-xl border bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left min-h-22"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 text-primary shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm truncate">Todos os Produtos</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">
                        {products.length} {products.length === 1 ? 'item' : 'itens'}
                      </span>
                    </button>
                    {categories.map((cat) => {
                      const count = cat._count?.products ?? products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setView({ type: 'category', id: cat.id, name: cat.name })}
                          className="group flex flex-col items-start justify-between p-3 rounded-xl border hover:bg-accent hover:border-primary/40 transition-all text-left min-h-22"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary shrink-0 transition-colors">
                              <Tag className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-sm truncate">{cat.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground mt-2">
                            {count} {count === 1 ? 'item' : 'itens'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="shrink-0 px-3 py-1.5 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  {categories.length} categoria{categories.length !== 1 ? 's' : ''} · selecione uma para ver os produtos
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 grid grid-cols-[1fr_80px_56px] lg:grid-cols-[1fr_80px_60px_56px] gap-x-3 px-3 py-2 bg-muted/40 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Preço</span>
                <span className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Est.</span>
                <span />
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingProds ? (
                  <div className="p-3 space-y-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    {search ? `Sem resultados para "${search}"` : 'Nenhum produto'}
                  </div>
                ) : (
                  filtered.map((p) => {
                    const inCart = cart.find((i) => i.productId === p.id);
                    const out = p.stock === 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { if (!out) { addToCart(p); if (window.innerWidth < 1024) setMobileView('cart'); } }}
                        className={cn(
                          'grid grid-cols-[1fr_80px_56px] lg:grid-cols-[1fr_80px_60px_56px] gap-x-3 px-3 py-2.5 text-sm border-b last:border-0 transition-colors',
                          !out && 'cursor-pointer hover:bg-accent',
                          inCart && !out && 'bg-primary/5 hover:bg-primary/10',
                          out && 'opacity-40 cursor-default',
                        )}
                      >
                        <span className="font-medium truncate flex items-center gap-1.5">
                          {p.name}
                          {inCart && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] shrink-0">
                              {fmtQty(inCart.quantity)}
                            </Badge>
                          )}
                          {p.activeDiscount && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] shrink-0 text-emerald-700 bg-emerald-100">
                              -{p.activeDiscount.percent}%
                            </Badge>
                          )}
                        </span>
                        <span className="text-right tabular-nums">
                          {p.activeDiscount ? (
                            <span className="text-emerald-600 font-semibold">{fmt(p.activeDiscount.discountedPrice)}</span>
                          ) : fmt(p.price)}
                        </span>
                        <span className={cn(
                          'hidden lg:block text-right tabular-nums',
                          p.stock > 0 && p.stock <= 5 && 'text-amber-600 font-medium',
                        )}>
                          {fmtQty(p.stock)}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailProduct(p); }}
                            title="Ver detalhes"
                            className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (!out) { addToCart(p); if (window.innerWidth < 1024) setMobileView('cart'); } }}
                            disabled={out}
                            className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-0 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="shrink-0 px-3 py-1.5 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
                  {search && ` · ENTER para adicionar`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: carrinho */}
        <div className={cn(
          'flex flex-col overflow-hidden flex-1',
          mobileView === 'cart' ? '' : 'hidden lg:flex',
        )}>
          <div className="shrink-0 grid grid-cols-[1fr_72px_90px_28px] lg:grid-cols-[1fr_72px_80px_90px_28px] gap-x-3 px-3 py-2 bg-muted/40 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Qtd</span>
            <span className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Preço</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Subtotal</span>
            <button
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              title="Limpar carrinho"
              className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-0 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <ShoppingCart className="h-8 w-8 opacity-15" />
                <p className="text-sm">Carrinho vazio</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="grid grid-cols-[1fr_72px_90px_28px] lg:grid-cols-[1fr_72px_80px_90px_28px] gap-x-3 items-center px-3 py-2 text-sm border-b last:border-0 hover:bg-muted/20 group"
                >
                  <span className="font-medium truncate flex items-center gap-1">
                    {item.name}
                    {item.discountPct && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1 rounded">-{item.discountPct}%</span>
                    )}
                  </span>
                  <QtyInput
                    quantity={item.quantity}
                    onChange={(raw) => setQty(item.productId, raw)}
                  />
                  <span className="hidden lg:block text-right tabular-nums text-muted-foreground">{fmt(item.price)}</span>
                  <span className="text-right tabular-nums font-semibold">{fmt(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-4 py-3">
            {/* Mobile footer */}
            <div className="flex sm:hidden flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Desc.</Label>
                  <div className="relative w-16">
                    <Input
                      type="number" min="0" max={MAX_DISCOUNT} step="0.5"
                      placeholder="0" value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      onBlur={(e) => {
                        const n = parseFloat(e.target.value);
                        if (e.target.value && !isNaN(n)) setDiscount(String(Math.min(Math.max(n, 0), MAX_DISCOUNT)));
                      }}
                      className="h-8 pr-5 text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="text-right">
                  {discountAmt > 0 && (
                    <p className="text-xs text-muted-foreground tabular-nums line-through">{fmt(gross)}</p>
                  )}
                  <div className="font-bold">
                    <span className="text-muted-foreground text-sm mr-1">Total</span>
                    <span className="text-primary tabular-nums text-lg">{fmt(total)}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full h-10 text-sm font-bold tracking-wide"
                onClick={() => setFinalizeOpen(true)}
                disabled={cart.length === 0 || !isCashOpen}
              >
                FINALIZAR VENDA
              </Button>
            </div>
            {/* Desktop footer */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Desconto</Label>
                <div className="relative w-20">
                  <Input
                    type="number" min="0" max={MAX_DISCOUNT} step="0.5"
                    placeholder="0" value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    onBlur={(e) => {
                      const n = parseFloat(e.target.value);
                      if (e.target.value && !isNaN(n)) setDiscount(String(Math.min(Math.max(n, 0), MAX_DISCOUNT)));
                    }}
                    className="h-8 pr-6 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-5 text-sm shrink-0">
                {discountAmt > 0 && (
                  <span className="text-muted-foreground tabular-nums">
                    {fmt(gross)} <span className="text-emerald-600">−{fmt(discountAmt)}</span>
                  </span>
                )}
                <div className="text-xl font-bold">
                  <span className="text-muted-foreground text-base mr-2">Total</span>
                  <span className="text-primary tabular-nums">{fmt(total)}</span>
                </div>
              </div>
              <Button
                className="h-11 px-8 text-sm font-bold tracking-wide shrink-0"
                onClick={() => setFinalizeOpen(true)}
                disabled={cart.length === 0 || !isCashOpen}
              >
                FINALIZAR VENDA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FinalizeSaleModal
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onSuccess={handleSuccess}
        total={total}
        gross={gross}
        discountPct={discountPct}
        cart={cart}
      />

      <ProductDetailsDialog
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(p) => {
          addToCart(p);
          setDetailProduct(null);
          if (window.innerWidth < 1024) setMobileView('cart');
        }}
      />
    </div>
  );
}

// ─── Product Details Dialog ───────────────────────────────────────────────────

function ProductDetailsDialog({
  product, onClose, onAddToCart,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const out = product?.stock === 0;
  const price = product?.activeDiscount?.discountedPrice ?? product?.price ?? 0;

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Produto</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="aspect-square w-full max-h-64 rounded-xl overflow-hidden border bg-muted/30 flex items-center justify-center">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageOff className="h-10 w-10 opacity-40" />
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
                {product.activeDiscount && (
                  <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 shrink-0">
                    -{product.activeDiscount.percent}%
                  </Badge>
                )}
              </div>
              {product.category && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  {product.category.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Preço</p>
                {product.activeDiscount ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-600 tabular-nums">{fmt(price)}</span>
                    <span className="text-xs text-muted-foreground line-through tabular-nums">{fmt(product.price)}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold tabular-nums">{fmt(product.price)}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Estoque</p>
                <p className={cn(
                  'text-lg font-bold tabular-nums',
                  out && 'text-destructive',
                  !out && product.stock <= 5 && 'text-amber-600',
                )}>
                  {fmtQty(product.stock)} {product.stock === 1 ? 'unidade' : 'unidades'}
                </p>
              </div>
              {product.barcode && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Código de Barras</p>
                  <p className="font-mono text-sm">{product.barcode}</p>
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            )}

            <Button
              className="w-full h-11 font-bold tracking-wide"
              onClick={() => onAddToCart(product)}
              disabled={out}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {out ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal de Finalização do PDV ──────────────────────────────────────────────

function FinalizeSaleModal({
  open, onClose, onSuccess,
  total, gross, discountPct, cart,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  total: number; gross: number; discountPct: number;
  cart: CartItem[];
}) {
  const [saleType, setSaleType]   = useState<'SPOT' | 'CREDIT'>('SPOT');
  const [sellerId, setSellerId]   = useState('');
  const [clientId, setClientId]   = useState('');
  const [sellers, setSellers]     = useState<Seller[]>([]);
  const [clients, setClients]     = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!open) return;
    setSaleType('SPOT');
    setSellerId('');
    setClientId('');
    setError('');
    setLoadingData(true);
    Promise.all([
      api.get<Seller[]>('/sales/sellers'),
      api.get<Client[]>('/clients'),
    ])
      .then(([sels, cls]) => {
        setSellers(sels);
        setClients(cls.filter((c: any) => c.active));
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [open]);

  const canConfirm = !!sellerId && (saleType === 'SPOT' || !!clientId);

  async function handleConfirm() {
    if (!sellerId) { setError('Selecione um vendedor'); return; }
    if (saleType === 'CREDIT' && !clientId) { setError('Venda a prazo requer um cliente'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/sales', {
        items:    cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        sellerId,
        saleType,
        clientId: clientId || undefined,
        discount: discountPct || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-4 text-center">
            {discountPct > 0 && (
              <p className="text-sm text-muted-foreground line-through tabular-nums">{fmt(gross)}</p>
            )}
            <p className="text-4xl font-bold text-primary tabular-nums">{fmt(total)}</p>
            {discountPct > 0 && (
              <p className="text-xs text-emerald-600 mt-0.5">Desconto de {discountPct}% aplicado</p>
            )}
          </div>

          {/* Tipo da venda */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
              Tipo da Venda
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setSaleType('SPOT'); setClientId(''); }}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all',
                  saleType === 'SPOT'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-primary/50 hover:bg-muted',
                )}
              >
                <Banknote className="h-4 w-4" />
                À Vista
              </button>
              <button
                onClick={() => setSaleType('CREDIT')}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all',
                  saleType === 'CREDIT'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-primary/50 hover:bg-muted',
                )}
              >
                <Clock className="h-4 w-4" />
                A Prazo
              </button>
            </div>
            {saleType === 'SPOT' && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Será finalizada no caixa.
              </p>
            )}
            {saleType === 'CREDIT' && (
              <p className="text-xs text-amber-600 mt-1.5">
                Vai direto para contas a receber. Vencimento em 30 dias.
              </p>
            )}
          </div>

          {/* Vendedor */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Vendedor <span className="text-destructive">*</span>
            </Label>
            {loadingData ? (
              <div className="h-9 bg-muted animate-pulse rounded-md" />
            ) : (
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Selecione o vendedor...</option>
                {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Cliente {saleType === 'CREDIT' && <span className="text-destructive">*</span>}
              {saleType === 'SPOT' && <span className="text-muted-foreground/60"> (opcional)</span>}
            </Label>
            {loadingData ? (
              <div className="h-9 bg-muted animate-pulse rounded-md" />
            ) : (
              <SearchSelect
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                value={clientId}
                onChange={setClientId}
                placeholder="Pesquisar cliente..."
                clearLabel="Nenhum"
              />
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            className="w-full h-12 text-base font-bold tracking-wide"
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
          >
            {loading ? 'Registrando...' : 'CONFIRMAR VENDA'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [sales, setSales]           = useState<Sale[]>([]);
  const [sellers, setSellers]       = useState<Seller[]>([]);
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(false);
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [sellerId, setSellerId]     = useState('');
  const [status, setStatus]         = useState('');
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [editSale, setEditSale]     = useState<Sale | null>(null);

  useEffect(() => {
    api.get<Seller[]>('/sales/sellers').then(setSellers).catch(() => {});
    api.get<Client[]>('/clients').then(setClients).catch(() => {});
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

  async function handleSaved() {
    setEditSale(null);
    await fetchHistory();
  }

  return (
    <div className="flex flex-col gap-4">
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
          <Label className="text-xs text-muted-foreground">Vendedor</Label>
          <select
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm w-40"
          >
            <option value="">Todos</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm w-32"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
          </select>
        </div>
        <Button size="sm" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Buscar
        </Button>
      </div>

      {sales.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground py-12 border rounded-xl">
          Nenhuma venda encontrada.
        </p>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{s.seller.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.client?.name ?? s.customerName ?? '—'}</TableCell>
                  <TableCell>
                    {s.paymentMethod === 'CREDIT'
                      ? <Badge variant="outline" className="text-amber-600 border-amber-300">A Prazo</Badge>
                      : <Badge variant="outline" className="text-blue-600 border-blue-300">À Vista</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{fmt(s.total)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'PAID' ? 'default' : 'secondary'}>
                      {s.status === 'PAID' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setDetailSale(s); setEditSale(null); }}>
                        Ver
                      </Button>
                      {s.status === 'PENDING' && s.paymentMethod !== 'CREDIT' && (
                        <Button size="sm" variant="outline" onClick={() => { setEditSale(s); setDetailSale(null); }}>
                          <Pencil className="h-3 w-3 mr-1" />Editar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SaleDetailsDialog
        sale={detailSale}
        onClose={() => setDetailSale(null)}
        onEdit={(s) => { setEditSale(s); setDetailSale(null); }}
      />
      <SaleEditDialog
        sale={editSale}
        sellers={sellers}
        clients={clients}
        onClose={() => setEditSale(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}

// ─── Sale Details Dialog ──────────────────────────────────────────────────────

function SaleDetailsDialog({
  sale, onClose, onEdit,
}: {
  sale: Sale | null; onClose: () => void; onEdit: (s: Sale) => void;
}) {
  return (
    <Dialog open={!!sale} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Detalhes da Venda</DialogTitle></DialogHeader>
        {sale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Vendedor', value: sale.seller.name },
                { label: 'Cliente', value: sale.client?.name ?? sale.customerName ?? '—' },
                { label: 'Data', value: new Date(sale.createdAt).toLocaleString('pt-BR') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tipo</p>
                {sale.paymentMethod === 'CREDIT'
                  ? <Badge variant="outline" className="text-amber-600 border-amber-300">A Prazo</Badge>
                  : <Badge variant="outline" className="text-blue-600 border-blue-300">À Vista</Badge>
                }
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <Badge variant={sale.status === 'PAID' ? 'default' : 'secondary'}>
                  {sale.status === 'PAID' ? 'Pago' : 'Pendente'}
                </Badge>
              </div>
              {sale.paymentMethod && sale.paymentMethod !== 'CREDIT' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Pagamento</p>
                  <Badge variant="outline">{PAYMENT_LABELS[sale.paymentMethod]}</Badge>
                </div>
              )}
            </div>
            <Separator />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-1.5 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="py-1.5 text-center font-medium text-muted-foreground">Qtd</th>
                  <th className="py-1.5 text-right font-medium text-muted-foreground">Unit.</th>
                  <th className="py-1.5 text-right font-medium text-muted-foreground">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-1.5">{item.product.name}</td>
                    <td className="py-1.5 text-center tabular-nums">{fmtQty(item.quantity)}</td>
                    <td className="py-1.5 text-right tabular-nums">{fmt(item.price)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span className="tabular-nums">{fmt(sale.total)}</span>
            </div>
            {sale.status === 'PENDING' && sale.paymentMethod !== 'CREDIT' && (
              <Button className="w-full" variant="outline" onClick={() => { onClose(); onEdit(sale); }}>
                <Pencil className="h-4 w-4 mr-2" />Editar Venda
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sale Edit Dialog ─────────────────────────────────────────────────────────

function SaleEditDialog({
  sale, sellers, clients, onClose, onSaved,
}: {
  sale: Sale | null; sellers: Seller[]; clients: Client[];
  onClose: () => void; onSaved: () => void;
}) {
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [sellerId, setSellerId]     = useState('');
  const [clientId, setClientId]     = useState('');
  const [discount, setDiscount]     = useState('');
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<Product[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const searchRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sale) return;
    setCart(sale.items.map((i) => ({
      productId: i.product.id, name: i.product.name,
      price: i.price, originalPrice: i.price, discountPct: null, quantity: i.quantity, stock: 9999,
    })));
    setSellerId(sale.seller.id);
    setClientId(sale.client?.id ?? '');
    setDiscount(sale.discount > 0 ? String(sale.discount) : '');
    setError(''); setQuery(''); setResults([]);
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
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, originalPrice: product.price, discountPct: null, quantity: 1, stock: product.stock }];
    });
    setQuery(''); setResults([]);
  }

  const discountPct = Math.min(parseFloat(discount) || 0, MAX_DISCOUNT);
  const gross       = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const total       = gross - gross * (discountPct / 100);

  async function handleSave() {
    if (!sale || cart.length === 0) { setError('A venda deve ter pelo menos 1 produto'); return; }
    setError('');
    setLoading(true);
    try {
      await api.put(`/sales/${sale.id}`, {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        sellerId: sellerId || undefined,
        clientId: clientId || undefined,
        discount: discountPct,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={!!sale} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Venda</DialogTitle></DialogHeader>
        {sale && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Adicionar produto..." value={query} onChange={(e) => setQuery(e.target.value)} />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover shadow-lg">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock === 0}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent disabled:opacity-40 first:rounded-t-lg last:rounded-b-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {fmtQty(p.stock)}</p>
                      </div>
                      <span className="font-semibold tabular-nums">{fmt(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border overflow-hidden">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum item</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Produto</th>
                      <th className="px-3 py-2 text-center font-medium">Qtd</th>
                      <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{item.name}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="outline" className="h-6 w-6"
                              onClick={() => setCart((p) => p.map((i) => i.productId === item.productId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter((i) => i.quantity > 0))}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-16">
                              <QtyInput
                                quantity={item.quantity}
                                onChange={(raw) => {
                                  const n = parseQty(raw);
                                  setCart((p) => {
                                    if (n <= 0) return p.filter((i) => i.productId !== item.productId);
                                    return p.map((i) =>
                                      i.productId === item.productId
                                        ? { ...i, quantity: Math.min(n, i.stock) }
                                        : i,
                                    );
                                  });
                                }}
                              />
                            </div>
                            <Button size="icon" variant="outline" className="h-6 w-6"
                              onClick={() => setCart((p) => p.map((i) => i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i))}
                              disabled={item.quantity >= item.stock}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(item.price * item.quantity)}</td>
                        <td className="px-2 py-2">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                            onClick={() => setCart((p) => p.filter((i) => i.productId !== item.productId))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vendedor</Label>
                <select value={sellerId} onChange={(e) => setSellerId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Selecione...</option>
                  {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Desconto (máx {MAX_DISCOUNT}%)</Label>
                <div className="relative">
                  <Input type="number" min="0" max={MAX_DISCOUNT} step="0.5" placeholder="0"
                    value={discount} onChange={(e) => setDiscount(e.target.value)}
                    onBlur={(e) => {
                      const n = parseFloat(e.target.value);
                      if (e.target.value && !isNaN(n)) setDiscount(String(Math.min(Math.max(n, 0), MAX_DISCOUNT)));
                    }}
                    className="pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Cliente cadastrado</Label>
                <SearchSelect options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  value={clientId} onChange={setClientId} placeholder="Pesquisar..." clearLabel="Nenhum" />
              </div>
            </div>

            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total estimado</span>
              <span className="tabular-nums">{fmt(total)}</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
