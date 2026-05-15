"use client";

import { useEffect, useState } from "react";
import { ShoppingBasket, Tag, Percent, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { DataPagination } from "@/components/data-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { normalizePaged } from "@/lib/paginate";
import { ProductDialog, Product } from "./product-dialog";
import { ProductHistoryDialog } from "./product-history-dialog";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Category = { id: string; name: string; description: string | null; _count?: { products: number } };

function activeDiscount(p: Product): number | null {
  const now  = new Date();
  const disc = p.discounts?.find(
    (d) => d.active && new Date(d.startDate) <= now && (!d.endDate || new Date(d.endDate) >= now),
  );
  return disc ? disc.percent : null;
}

const LIMIT = 20;

export default function ProductsPage() {
  const [activeTab, setActiveTab]     = useState<"produtos" | "categorias">("produtos");
  const [products, setProducts]       = useState<Product[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isLoading, setIsLoading]     = useState(true);
  const [isProductModalOpen, setIsProductModalOpen]   = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [history, setHistory]         = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function loadCategories() {
    const result = await api.get<Category[]>("/products/categories");
    setCategories(result);
  }

  async function loadProducts(searchTerm: string, targetPage: number, categoryId: string) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm)  params.set("search", searchTerm);
    if (categoryId)  params.set("categoryId", categoryId);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: Product[]; total: number } | Product[]>(`/products?${params}`),
      );
      setProducts(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategoryId]);
  useEffect(() => {
    if (activeTab === "produtos") loadProducts(debouncedSearch, page, selectedCategoryId);
  }, [debouncedSearch, page, selectedCategoryId, activeTab]);

  function openCreateProduct() { setEditingProduct(null); setIsProductModalOpen(true); }
  function openEditProduct(p: Product) { setEditingProduct(p); setIsProductModalOpen(true); }

  function openCreateCategory() { setEditingCategory(null); setIsCategoryModalOpen(true); }
  function openEditCategory(c: Category) { setEditingCategory(c); setIsCategoryModalOpen(true); }

  function handleProductSuccess() {
    setIsProductModalOpen(false);
    loadProducts(debouncedSearch, page, selectedCategoryId);
  }

  function handleCategorySuccess() {
    setIsCategoryModalOpen(false);
    loadCategories();
  }

  const filterContent = categories.length > 0 ? (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Categoria
      </Label>
      <select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">Todas as categorias</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    </div>
  ) : undefined;

  return (
    <div>
      <PageHeader
        icon={ShoppingBasket}
        title="Produtos"
        description="Produtos, categorias e estoque"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
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
            {activeTab === "produtos"   && <Button onClick={openCreateProduct}><Plus className="h-4 w-4 mr-1.5" />Novo produto</Button>}
            {activeTab === "categorias" && <Button onClick={openCreateCategory}><Plus className="h-4 w-4 mr-1.5" />Nova categoria</Button>}
          </div>
        }
        search={activeTab === "produtos" ? search : undefined}
        onSearchChange={activeTab === "produtos" ? setSearch : undefined}
        searchPlaceholder="Nome, descrição ou código de barras..."
        filterContent={activeTab === "produtos" ? filterContent : undefined}
        isFilterActive={!!selectedCategoryId}
        onClearFilters={() => setSelectedCategoryId("")}
      />

      {activeTab === "produtos" ? (
        <>
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
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">Carregando...</TableCell>
                  </TableRow>
                )}
                {!isLoading && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</TableCell>
                  </TableRow>
                )}
                {!isLoading && products.map((p) => {
                  const margin    = p.costPrice != null && p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : null;
                  const disc      = activeDiscount(p);
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
                        {p.description && <div className="text-xs text-muted-foreground truncate max-w-45">{p.description}</div>}
                      </TableCell>
                      <TableCell>
                        {p.category ? (
                          <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{p.category.name}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{p.barcode || <span className="italic">—</span>}</TableCell>
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
                        <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setHistory(p)}>Histórico</Button>
                          <Button size="sm" variant="outline" onClick={() => openEditProduct(p)}>Editar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />
        </>
      ) : (
        <CategoriesTab
          categories={categories}
          onEditCategory={openEditCategory}
          onRefresh={loadCategories}
        />
      )}

      <ProductDialog
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={handleProductSuccess}
        product={editingProduct}
        categories={categories}
      />
      <CategoryModal
        open={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategorySuccess}
      />
      <ProductHistoryDialog product={history} onClose={() => setHistory(null)} />
    </div>
  );
}

function CategoriesTab({
  categories, onEditCategory, onRefresh,
}: {
  categories: Category[];
  onEditCategory: (c: Category) => void;
  onRefresh: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);
  const [delError, setDelError]     = useState('');

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

  if (categories.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 border rounded-xl">
        <Tag className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Nenhuma categoria cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {cat.description || <span className="italic">—</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{cat._count?.products ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEditCategory(cat)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => { setDelError(''); setConfirmDel(cat); }}
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
            <Button variant="destructive" onClick={() => confirmDel && handleDelete(confirmDel)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryModal({
  open, category, onClose, onSuccess,
}: {
  open: boolean; category: Category | null; onClose: () => void; onSuccess: () => void;
}) {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [error, setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDesc(category?.description ?? '');
      setError('');
    }
  }, [open, category]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle></DialogHeader>
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
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
