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
import { UserDialog } from './user-dialog';

type Role = { id: string; name: string };
type User = {
  id: string; name: string; email: string; cpf: string | null;
  phone: string | null; address: string | null; description: string | null;
  active: boolean; role: Role; createdAt: string;
};

const LIMIT = 20;

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([]);
  const [roles, setRoles]         = useState<Role[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen]       = useState(false);
  const [editing, setEditing]     = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function loadRoles() {
    const result = await api.get<Role[]>('/roles');
    setRoles(result.filter((r) => r.name !== 'ADMIN'));
  }

  async function load(searchTerm: string, targetPage: number, roleId: string) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm) params.set('search', searchTerm);
    if (roleId) params.set('roleId', roleId);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: User[]; total: number } | User[]>(`/users?${params}`),
      );
      setUsers(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedRoleId]);
  useEffect(() => { load(debouncedSearch, page, selectedRoleId); }, [debouncedSearch, page, selectedRoleId]);

  function handleOpenCreate() {
    setEditing(null);
    setIsOpen(true);
  }

  function handleOpenEdit(user: User) {
    setEditing(user);
    setIsOpen(true);
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Desativar este usuário?')) return;
    await api.delete(`/users/${id}`);
    load(debouncedSearch, page, selectedRoleId);
  }

  function handleSuccess() {
    setIsOpen(false);
    load(debouncedSearch, page, selectedRoleId);
  }

  const filterContent = roles.length > 0 ? (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Perfil de acesso
      </Label>
      <select
        value={selectedRoleId}
        onChange={(e) => setSelectedRoleId(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">Todos os perfis</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>
    </div>
  ) : undefined;

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Usuários"
        description="Gerencie os usuários da empresa"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo usuário
          </Button>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome, email, telefone ou CPF..."
        filterContent={filterContent}
        isFilterActive={!!selectedRoleId}
        onClearFilters={() => setSelectedRoleId('')}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
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
          {!isLoading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
              <TableCell>{user.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{user.cpf ?? '—'}</TableCell>
              <TableCell><Badge variant="outline">{user.role.name}</Badge></TableCell>
              <TableCell>
                <Badge variant={user.active ? 'default' : 'secondary'}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(user)}>
                  Editar
                </Button>
                {user.active && (
                  <Button size="sm" variant="destructive" onClick={() => handleDeactivate(user.id)}>
                    Desativar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />

      <UserDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        roles={roles}
        user={editing}
      />
    </div>
  );
}
