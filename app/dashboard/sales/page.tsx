'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Search, Trash2, Plus, Minus, ShoppingCart, CheckCircle } from 'lucide-react';

type Product = { id: string; name: string; price: number; stock: number; imageUrl: string | null };
type Seller  = { id: string; name: string };
type CartItem = { productId: string; name: string; price: number; quantity: number; stock: number };

const MAX_DISCOUNT = 5;

export default function SalesPage() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<Product[]>([]);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [sellers, setSellers]     = useState<Seller[]>([]);
  const [sellerId, setSellerId]   = useState('');
  const [customerName, setCustomer] = useState('');
  const [discount, setDiscount]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const searchRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get<Seller[]>('/sales/sellers').then(setSellers).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!query.trim()) { setResults([]); return; }
    searchRef.current = setTimeout(async () => {
      try {
        const data = await api.get<Product[]>(`/sales/products?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch { setResults([]); }
    }, 300);
  }, [query]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      if (product.stock === 0) return prev;
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
    setQuery('');
    setResults([]);
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const gross       = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountPct = Math.min(parseFloat(discount) || 0, MAX_DISCOUNT);
  const discountAmt = gross * (discountPct / 100);
  const total       = gross - discountAmt;

  async function handleCreate() {
    if (cart.length === 0) { setError('Adicione pelo menos 1 produto'); return; }
    if (!sellerId) { setError('Selecione um vendedor'); return; }
    if (discountPct > MAX_DISCOUNT) { setError(`Desconto máximo é ${MAX_DISCOUNT}%`); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/sales', {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        sellerId,
        discount: discountPct || undefined,
        customerName: customerName || undefined,
      });
      setSuccess(true);
      setCart([]);
      setSellerId('');
      setCustomer('');
      setDiscount('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDV — Nova Venda</h1>
        <span className="text-sm text-muted-foreground">O pagamento é definido no caixa</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1">

        {/* LEFT — busca + carrinho */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar produto por nome ou código..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border bg-popover shadow-lg">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent disabled:opacity-40 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-8 w-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Estoque: {p.stock}</p>
                    </div>
                    <span className="font-semibold shrink-0">{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border flex-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <ShoppingCart className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nenhum item adicionado</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Produto</th>
                    <th className="px-4 py-2 text-center font-medium">Qtd</th>
                    <th className="px-4 py-2 text-right font-medium">Unit.</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.productId} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeQty(item.productId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeQty(item.productId, 1)} disabled={item.quantity >= item.stock}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-4 py-2 text-right font-semibold">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-2 py-2">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.productId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT — resumo */}
        <div className="rounded-lg border p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-base">Dados da Venda</h2>

          <div className="space-y-1.5">
            <Label>Vendedor <span className="text-destructive">*</span></Label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecione o vendedor...</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Nome do cliente <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              placeholder="Ex: João da Silva"
              value={customerName}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Desconto (máx {MAX_DISCOUNT}%)</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max={MAX_DISCOUNT}
                step="0.5"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({discountPct}%)</span>
                <span>− {discountAmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2">
            A forma de pagamento e o status serão definidos pelo caixa ao finalizar esta venda.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Venda criada! Dirija-se ao caixa para finalizar.
            </div>
          )}

          <Button
            className="w-full mt-auto"
            size="lg"
            onClick={handleCreate}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Criando...' : 'Criar Venda'}
          </Button>
        </div>
      </div>
    </div>
  );
}
