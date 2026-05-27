'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { resetPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas nao conferem.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/logo-white.png" alt="WebUp" width={56} height={56} priority />
          <span className="mt-2 text-xl font-bold text-[#0057E7]">AgroERP</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900">Redefinir senha</h2>
        <p className="mt-1 text-sm text-gray-500">Escolha uma nova senha para sua conta.</p>

        {!token ? (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            Token nao informado. Solicite um novo link de redefinicao.
          </div>
        ) : done ? (
          <div className="mt-6 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
            Senha redefinida com sucesso. Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  placeholder="Minimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white pr-11 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirmar senha</Label>
              <Input
                id="confirm"
                type={show ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#0057E7] hover:bg-[#0046C0] text-white font-semibold text-sm shadow-md shadow-blue-200 transition-all disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                : 'Redefinir senha'}
            </Button>

            <Link
              href="/login"
              className="block text-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
