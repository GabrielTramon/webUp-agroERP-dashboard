'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/api';
import { hasPermission, isSuperAdminUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      if (isSuperAdminUser()) {
        router.push('/admin');
        return;
      }
      if (!hasPermission('dashboard:acessar')) {
        setError('Seu perfil não tem acesso ao painel.');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-[#0057E7] px-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white" />
          <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full bg-white" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30 shadow-2xl">
            <Image src="/logo-white.png" alt="WebUp" width={72} height={72} priority />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            AgroERP
          </h1>
          <p className="mt-3 text-lg font-medium text-blue-100">
            by WebUp
          </p>

          <div className="mt-10 w-72 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 p-5 text-left">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-3">
              O que você gerencia aqui
            </p>
            {['Clientes e vendas', 'Usuários e permissões', 'Perfis de acesso'].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-xs text-blue-200/60">
          © {new Date().getFullYear()} WebUp. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Image src="/logo-white.png" alt="WebUp" width={56} height={56} priority />
            <span className="mt-2 text-xl font-bold text-[#0057E7]">AgroERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-gray-500">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white pr-11 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 mt-1.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#0057E7] hover:bg-[#0046C0] text-white font-semibold text-sm shadow-md shadow-blue-200 transition-all disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
