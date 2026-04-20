'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserDialog } from './user-dialog';

type Role = { id: string; name: string };
type User = { id: string; name: string; email: string; active: boolean; role: Role; createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    const [u, r] = await Promise.all([
      api.get<User[]>('/users'),
      api.get<Role[]>('/roles'),
    ]);
    setUsers(u);
    setRoles(r.filter((r) => r.name !== 'ADMIN'));
  }

  useEffect(() => { load(); }, []);

  async function handleDeactivate(id: string) {
    await api.delete(`/users/${id}`);
    load();
  }

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(u: User) { setEditing(u); setOpen(true); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Button onClick={openCreate}>Novo usuário</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell><Badge variant="outline">{u.role.name}</Badge></TableCell>
              <TableCell>
                <Badge variant={u.active ? 'default' : 'secondary'}>
                  {u.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                {u.active && (
                  <Button size="sm" variant="destructive" onClick={() => handleDeactivate(u.id)}>
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
        onSuccess={() => { setOpen(false); load(); }}
        roles={roles}
        user={editing}
      />
    </div>
  );
}
