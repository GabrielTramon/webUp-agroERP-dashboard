'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

type AdminUser = { id: string; name: string; email: string };

interface Props {
  user: AdminUser | null;
  onClose: () => void;
}

export function ResetPasswordDialog({ user, onClose }: Props) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setMode('auto');
      setNewPassword('');
      setError('');
      setResult(null);
      setCopied(false);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    if (mode === 'manual' && newPassword.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const body = mode === 'manual' ? { newPassword } : {};
      const res = await api.post<{ id: string; password: string }>(
        `/admin/users/${user.id}/reset-password`,
        body,
      );
      setResult(res.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
        </DialogHeader>

        {user && (
          <p className="text-sm text-muted-foreground">
            Usuario: <span className="font-medium text-foreground">{user.name}</span>
            {' '}({user.email})
          </p>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              Senha redefinida. Compartilhe a nova senha com o usuario por um canal seguro
              — ela nao sera mostrada novamente.
            </div>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <div className="flex gap-2">
                <Input value={result} readOnly className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  mode === 'auto' ? 'bg-background shadow' : 'text-muted-foreground'
                }`}
              >
                Gerar senha
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  mode === 'manual' ? 'bg-background shadow' : 'text-muted-foreground'
                }`}
              >
                Definir senha
              </button>
            </div>

            {mode === 'manual' && (
              <div className="space-y-1.5">
                <Label>Nova senha *</Label>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>
            )}

            {mode === 'auto' && (
              <p className="text-sm text-muted-foreground">
                Uma senha aleatoria sera gerada e exibida ao concluir.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Redefinir'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
