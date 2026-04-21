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
import { RoleDialog } from './role-dialog';

type Permission = { id: string; name: string; description: string | null };
type RolePermission = { permission: Permission };
type Role = { id: string; name: string; description: string | null; permissions: RolePermission[] };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? roles.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : roles;

  async function load() {
    const [r, p] = await Promise.all([
      api.get<Role[]>('/roles'),
      api.get<Permission[]>('/permissions'),
    ]);
    setRoles(r);
    setPermissions(p);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(r: Role) { setEditing(r); setOpen(true); }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button onClick={openCreate}>Nova role</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma role encontrada.</TableCell></TableRow>
          )}
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{r.description ?? '—'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((rp) => (
                    <Badge key={rp.permission.id} variant="secondary">{rp.permission.name}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RoleDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); load(); }}
        permissions={permissions}
        role={editing}
      />
    </div>
  );
}
