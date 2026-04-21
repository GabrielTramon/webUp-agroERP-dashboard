'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const BASE = process.env.NEXT_PUBLIC_API_URL;

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  imageUrl: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
};

export function ProductDialog({ open, onClose, onSuccess, product }: Props) {
  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [price, setPrice]           = useState('');
  const [costPrice, setCostPrice]   = useState('');
  const [stock, setStock]           = useState('');
  const [imageUrl, setImageUrl]     = useState('');
  const [imagePreview, setPreview]  = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDesc(product.description ?? '');
      setPrice(String(product.price));
      setCostPrice(product.costPrice != null ? String(product.costPrice) : '');
      setStock(String(product.stock));
      setImageUrl(product.imageUrl ?? '');
      setPreview(product.imageUrl ?? null);
    } else {
      setName(''); setDesc(''); setPrice(''); setCostPrice('');
      setStock(''); setImageUrl(''); setPreview(null);
    }
    setError('');
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
        price:        parseFloat(price),
        costPrice:    parsedCost,
        stock:        parseInt(stock, 10),
        imageUrl:     imageUrl || undefined,
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

  const priceVal    = parseFloat(price)     || 0;
  const costVal     = parseFloat(costPrice) || 0;
  const margin      = priceVal > 0 && costVal > 0
    ? ((priceVal - costVal) / priceVal) * 100
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Preço de venda (R$)</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>
                Preço de custo (R$)
                <span className="ml-1 text-xs text-muted-foreground font-normal">opcional</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
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
              required
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Imagem</Label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded object-cover" />
            )}
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
            />
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
      </DialogContent>
    </Dialog>
  );
}
