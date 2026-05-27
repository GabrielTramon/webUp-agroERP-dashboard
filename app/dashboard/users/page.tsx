'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserDialog } from './user-dialog';
import {
  useDashboardUsers, useRoles, useDeactivateDashboardUser,
  type DashboardUser,
} from '@/lib/queries';

export default function UsersPage() {
  const { data: users = [], refetch } = useDashboardUsers();
  const { data: allRoles = [] } = useRoles();
  const deactivate = useDeactivateDashboardUser();
  const [open, setOpen]   = useState(false);
  const [editing, setEditing] = useState<DashboardUser | null>(null);
  const [search, setSearch] = useState('');

  const roles = allRoles.filter((r) => r.name !== 'ADMIN');

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search) ||
        u.cpf?.includes(search),
      )
    : users;

  async function handleDeactivate(id: string) {
    if (!confirm('Desativar este usuário?')) return;
    await deactivate.mutateAsync(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Novo usuário</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email, telefone ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</TableCell></TableRow>
          )}
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
              <TableCell>{u.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{u.cpf ?? '—'}</TableCell>
              <TableCell><Badge variant="outline">{u.role.name}</Badge></TableCell>
              <TableCell>
                <Badge variant={u.active ? 'default' : 'secondary'}>
                  {u.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(u); setOpen(true); }}>
                  Editar
                </Button>
                {u.active && (
                  <Button size="sm" variant="destructive" onClick={() => handleDeactivate(u.id)} disabled={deactivate.isPending}>
                    Desativar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); refetch(); }}
        roles={roles}
        user={editing}
      />
    </div>
  );
}
