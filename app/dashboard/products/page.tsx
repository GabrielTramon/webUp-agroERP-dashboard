"use client";

import { useEffect, useState } from "react";
import { Search, Tag, Percent, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ProductDialog, Product } from "./product-dialog";
import { ProductHistoryDialog } from "./product-history-dialog";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Category = { id: string; name: string; description: string | null; _count?: { products: number } };

function activeDiscount(p: Product): number | null {
  const now = new Date();
  const disc = p.discounts?.find(
    (d) =>
      d.active &&
      new Date(d.startDate) <= now &&
      (!d.endDate || new Date(d.endDate) >= now),
  );
  return disc ? disc.percent : null;
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"produtos" | "categorias">("produtos");
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [history, setHistory]     = useState<Product | null>(null);
  const [search, setSearch]       = useState("");

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  async function load() {
    const [prods, cats] = await Promise.all([
      api.get<Product[]>("/products"),
      api.get<Category[]>("/products/categories"),
    ]);
    setProducts(prods);
    setCategories(cats);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(p: Product) { setEditing(p); setOpen(true); }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold mr-2">Produtos</h1>
          {(["produtos", "categorias"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors capitalize",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {tab === "categorias" && <Tag className="h-3.5 w-3.5" />}
              {tab === "produtos" ? "Produtos" : "Categorias"}
            </button>
          ))}
        </div>
        {activeTab === "produtos" && (
          <Button onClick={openCreate}>Novo produto</Button>
        )}
        {activeTab === "categorias" && (
          <Button onClick={() => {/* handled inside tab */}} id="new-category-btn">
            Nova categoria
          </Button>
        )}
      </div>

      {activeTab === "produtos" ? (
        <ProductsTab
          products={filtered}
          categories={categories}
          search={search}
          onSearch={setSearch}
          onEdit={openEdit}
          onHistory={(p) => setHistory(p)}
        />
      ) : (
        <CategoriesTab categories={categories} onRefresh={load} />
      )}

      <ProductDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); load(); }}
        product={editing}
        categories={categories}
      />
      <ProductHistoryDialog product={history} onClose={() => setHistory(null)} />
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({
  products, categories, search, onSearch, onEdit, onHistory,
}: {
  products: Product[];
  categories: Category[];
  search: string;
  onSearch: (s: string) => void;
  onEdit: (p: Product) => void;
  onHistory: (p: Product) => void;
}) {
  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nome, descrição ou código de barras..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <Table className="min-w-215">
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Código de barras</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => {
              const margin = p.costPrice != null && p.price > 0
                ? ((p.price - p.costPrice) / p.price) * 100
                : null;
              const disc = activeDiscount(p);
              const discPrice = disc != null ? Math.round(p.price * (1 - disc / 100) * 100) / 100 : null;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{p.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.category ? (
                      <Badge variant="outline" className="gap-1">
                        <Tag className="h-3 w-3" />{p.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {p.barcode || <span className="italic">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {p.costPrice != null ? fmt(p.costPrice) : <span className="text-xs italic">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {disc != null ? (
                      <div>
                        <span className="line-through text-muted-foreground text-xs">{fmt(p.price)}</span>
                        <div className="font-semibold text-emerald-600">{fmt(discPrice!)}</div>
                        <Badge variant="secondary" className="text-[10px] px-1 h-4 text-emerald-700 bg-emerald-100">
                          <Percent className="h-2.5 w-2.5 mr-0.5" />{disc}% off
                        </Badge>
                      </div>
                    ) : (
                      <span className="font-medium">{fmt(p.price)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {margin !== null ? (
                      <Badge
                        variant={margin >= 20 ? "default" : margin >= 10 ? "secondary" : "outline"}
                        className={margin < 10 ? "text-destructive border-destructive/30" : ""}
                      >
                        {margin.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "default" : "secondary"}>
                      {p.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onHistory(p)}>
                        Histórico
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories, onRefresh }: { categories: Category[]; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Category | null>(null);
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);
  const [delError, setDelError]   = useState('');

  useEffect(() => {
    const btn = document.getElementById('new-category-btn');
    if (!btn) return;
    const handler = () => { setEditing(null); setModalOpen(true); };
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  async function handleDelete(cat: Category) {
    setDelError('');
    try {
      await api.delete(`/products/categories/${cat.id}`);
      setConfirmDel(null);
      onRefresh();
    } catch (err) {
      setDelError(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-xl">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhuma categoria cadastrada.</p>
          <Button size="sm" className="mt-4" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />Criar primeira categoria
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.description || <span className="italic">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c._count?.products ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(c); setModalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setDelError(''); setConfirmDel(c); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        category={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); onRefresh(); }}
      />

      <Dialog open={!!confirmDel} onOpenChange={(v) => { if (!v) setConfirmDel(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir categoria</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{confirmDel?.name}</strong>?
            {confirmDel?._count?.products
              ? ` Esta categoria possui ${confirmDel._count.products} produto(s) vinculado(s).`
              : ''}
          </p>
          {delError && <p className="text-sm text-destructive">{delError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDel && handleDelete(confirmDel)}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({
  open, category, onClose, onSuccess,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDesc(category?.description ?? '');
      setError('');
    }
  }, [open, category]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (category) {
        await api.put(`/products/categories/${category.id}`, { name, description: desc || undefined });
      } else {
        await api.post('/products/categories', { name, description: desc || undefined });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input required value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição <span className="text-xs text-muted-foreground font-normal">opcional</span></Label>
            <Input value={desc} maxLength={300} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
