'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { DataPagination } from '@/components/data-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { normalizePaged } from '@/lib/paginate';
import { CompanyDialog } from './company-dialog';

type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  _count: { users: number; clients: number; sales: number };
};

const LIMIT = 20;

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen]       = useState(false);
  const [editing, setEditing]     = useState<Company | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function load(searchTerm: string, targetPage: number) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm) params.set('search', searchTerm);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: Company[]; total: number } | Company[]>(`/admin/companies?${params}`),
      );
      setCompanies(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { load(debouncedSearch, page); }, [debouncedSearch, page]);

  function handleOpenCreate() {
    setEditing(null);
    setIsOpen(true);
  }

  function handleOpenEdit(company: Company) {
    setEditing(company);
    setIsOpen(true);
  }

  function handleSuccess() {
    setIsOpen(false);
    load(debouncedSearch, page);
  }

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="Empresas"
        description="Gerencie as empresas do sistema"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova empresa
          </Button>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome ou slug..."
      />

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Criada em</TableHead>
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
            {!isLoading && companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{company.slug}</Badge>
                </TableCell>
                <TableCell>{company._count.users}</TableCell>
                <TableCell>{company._count.clients}</TableCell>
                <TableCell>{company._count.sales}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(company)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />

      <CompanyDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        company={editing}
      />
    </div>
  );
}
