'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AdminUserDialog } from './admin-user-dialog';
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
  }

  return (
    <div>
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{u.company?.name ?? '—'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role?.name === 'ADMIN' ? 'default' : 'secondary'}>
                    {u.role?.name ?? '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? 'default' : 'secondary'}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(u); setOpen(true); }}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setResetting(u)}>
                    Redefinir senha
                  </Button>
                  {u.active ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(u.id)} disabled={deactivate.isPending}>
                      Desativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => reactivate.mutate(u.id)} disabled={reactivate.isPending}>
                      Ativar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminUserDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); refetch(); }}
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
