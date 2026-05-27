'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { forgotPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
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

        <h2 className="text-xl font-bold text-gray-900">Esqueci a senha</h2>
        <p className="mt-1 text-sm text-gray-500">
          Informe seu email e enviaremos um link para redefinir a senha.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              Se o email estiver cadastrado, voce recebera um link para redefinir a senha. Verifique sua caixa de entrada e a pasta de spam.
            </div>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-[#0057E7] hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#0057E7] hover:bg-[#0046C0] text-white font-semibold text-sm shadow-md shadow-blue-200 transition-all disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                : 'Enviar link'}
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
