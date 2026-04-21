'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Role = { id: string; name: string };
type User = {
  id: string; name: string; email: string; cpf: string | null;
  phone: string | null; address: string | null; description: string | null;
  role: Role;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: Role[];
  user: User | null;
};

export function UserDialog({ open, onClose, onSuccess, roles, user }: Props) {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [roleId, setRoleId]         = useState('');
  const [phone, setPhone]           = useState('');
  const [cpf, setCpf]               = useState('');
  const [address, setAddress]       = useState('');
  const [description, setDescription] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRoleId(user.role.id);
      setPhone(user.phone ?? '');
      setCpf(user.cpf ?? '');
      setAddress(user.address ?? '');
      setDescription(user.description ?? '');
      setPassword('');
    } else {
      setName(''); setEmail(''); setPassword(''); setRoleId('');
      setPhone(''); setCpf(''); setAddress(''); setDescription('');
    }
    setError('');
  }, [user, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        roleId,
        phone: phone || undefined,
        cpf: cpf || undefined,
        address: address || undefined,
        description: description || undefined,
      };
      if (user) {
        await api.put(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', { ...payload, password });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Telefone <span className="text-destructive">*</span></Label>
              <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
          </div>

          {!user && (
            <div className="space-y-1">
              <Label>Senha <span className="text-destructive">*</span></Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <Label>Perfil <span className="text-destructive">*</span></Label>
            <Select required value={roleId} onValueChange={(v) => setRoleId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Endereço</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
