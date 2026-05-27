'use client';

<<<<<<< HEAD
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
=======
import { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { api } from '@/lib/api';
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
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
<<<<<<< HEAD
import { ResetPasswordDialog } from './reset-password-dialog';
import {
  useAdminCompanies, useAdminUsers,
  useDeactivateAdminUser, useReactivateAdminUser,
  type AdminUser,
} from '@/lib/queries';

export default function AdminUsersPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');

  const { data: companies = [] } = useAdminCompanies();
  const { data: users = [], refetch } = useAdminUsers(selectedCompanyId || undefined);
  const deactivate = useDeactivateAdminUser();
  const reactivate = useReactivateAdminUser();

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search),
      )
    : users;

  async function handleDeactivate(id: string) {
    if (!confirm('Desativar este usuário?')) return;
    await deactivate.mutateAsync(id);
=======

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
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
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
<<<<<<< HEAD
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} usuário(s)</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo usuário
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm min-w-48"
        >
          <option value="">Todas as empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
=======
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
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a

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
<<<<<<< HEAD
                  <Button size="sm" variant="outline" onClick={() => setResetting(u)}>
                    Redefinir senha
                  </Button>
                  {u.active ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(u.id)} disabled={deactivate.isPending}>
                      Desativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => reactivate.mutate(u.id)} disabled={reactivate.isPending}>
=======
                  {user.active ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(user.id)}>
                      Desativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(user.id)}>
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
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
<<<<<<< HEAD
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); refetch(); }}
=======
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
        user={editing}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
      />

      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
      />
    </div>
  );
}
