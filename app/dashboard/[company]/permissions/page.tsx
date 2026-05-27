'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type Permission = { id: string; name: string; description: string | null };

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    api.get<Permission[]>('/permissions').then(setPermissions);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Permissões</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-sm">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">{p.description ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
