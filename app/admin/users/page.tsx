'use client';

import { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { DataPagination } from '@/components/data-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { normalizePaged } from '@/lib/paginate';
import { AdminUserDialog } from './admin-user-dialog';

type Role    = { id: string; name: string };
type Company = { id: string; name: string };
type AdminUser = {
  id: string; name: string; email: string; phone: string | null;
  cpf: string | null; active: boolean; role: Role; company: Company; createdAt: string;
};

const LIMIT = 20;

export default function AdminUsersPage() {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [isOpen, setIsOpen]             = useState(false);
  const [editing, setEditing]           = useState<AdminUser | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function loadCompanies() {
    const result = await api.get<Company[]>('/admin/companies');
    setCompanies(result);
  }

  async function load(searchTerm: string, targetPage: number, companyId: string) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm) params.set('search', searchTerm);
    if (companyId) params.set('companyId', companyId);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: AdminUser[]; total: number } | AdminUser[]>(`/admin/users?${params}`),
      );
      setUsers(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCompanyId]);
  useEffect(() => { load(debouncedSearch, page, selectedCompanyId); }, [debouncedSearch, page, selectedCompanyId]);

  function handleOpenCreate() {
    setEditing(null);
    setIsOpen(true);
  }

  function handleOpenEdit(user: AdminUser) {
    setEditing(user);
    setIsOpen(true);
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Desativar este usuário?')) return;
    await api.delete(`/admin/users/${id}`);
    load(debouncedSearch, page, selectedCompanyId);
  }

  async function handleActivate(id: string) {
    await api.patch(`/admin/users/${id}`, { active: true });
    load(debouncedSearch, page, selectedCompanyId);
  }

  function handleSuccess() {
    setIsOpen(false);
    load(debouncedSearch, page, selectedCompanyId);
  }

  const filterContent = (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Empresa
      </Label>
      <select
        value={selectedCompanyId}
        onChange={(e) => setSelectedCompanyId(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">Todas as empresas</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Usuários"
        description="Gerencie os administradores das empresas"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo usuário
          </Button>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome, email ou telefone..."
        filterContent={filterContent}
        isFilterActive={!!selectedCompanyId}
        onClearFilters={() => setSelectedCompanyId('')}
      />

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{user.company?.name ?? '—'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role?.name === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role?.name ?? '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'secondary'}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(user)}>
                    Editar
                  </Button>
                  {user.active ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(user.id)}>
                      Desativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(user.id)}>
                      Ativar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />

      <AdminUserDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        user={editing}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
      />
    </div>
  );
}
