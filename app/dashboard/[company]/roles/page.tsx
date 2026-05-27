'use client';

import { useEffect, useState } from 'react';
import { Shield, Plus } from 'lucide-react';
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
import { RoleDialog } from './role-dialog';

type Permission    = { id: string; name: string; description: string | null };
type RolePermission = { permission: Permission };
type Role          = { id: string; name: string; description: string | null; permissions: RolePermission[] };

const LIMIT = 20;

export default function RolesPage() {
  const [roles, setRoles]           = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [isLoading, setIsLoading]   = useState(true);
  const [isOpen, setIsOpen]         = useState(false);
  const [editing, setEditing]       = useState<Role | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  async function loadPermissions() {
    const result = await api.get<Permission[]>('/permissions');
    setPermissions(result);
  }

  async function load(searchTerm: string, targetPage: number) {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT) });
    if (searchTerm) params.set('search', searchTerm);
    try {
      const { items, total } = normalizePaged(
        await api.get<{ items: Role[]; total: number } | Role[]>(`/roles?${params}`),
      );
      setRoles(items);
      setTotal(total);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadPermissions(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { load(debouncedSearch, page); }, [debouncedSearch, page]);

  function openCreate() { setEditing(null); setIsOpen(true); }
  function openEdit(role: Role) { setEditing(role); setIsOpen(true); }

  function handleSuccess() {
    setIsOpen(false);
    load(debouncedSearch, page);
  }

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Perfis de acesso"
        description="Gerencie os perfis e permissões"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo perfil
          </Button>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome ou descrição..."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Permissões</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && roles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhum perfil encontrado.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell className="text-muted-foreground">{role.description ?? '—'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((rp) => (
                    <Badge key={rp.permission.id} variant="secondary">{rp.permission.name}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => openEdit(role)}>Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataPagination page={page} total={total} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />

      <RoleDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        permissions={permissions}
        role={editing}
      />
    </div>
  );
}
