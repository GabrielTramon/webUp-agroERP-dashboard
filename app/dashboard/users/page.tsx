'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserDialog } from './user-dialog';

type Role = { id: string; name: string };
type User = {
  id: string; name: string; email: string; cpf: string | null;
  phone: string | null; address: string | null; description: string | null;
  active: boolean; role: Role; createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen]   = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search) ||
        u.cpf?.includes(search),
      )
    : users;

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
    if (!confirm('Desativar este usuário?')) return;
    await api.delete(`/users/${id}`);
    load();
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
