const BASE = process.env.NEXT_PUBLIC_API_URL;

type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

export async function login(payload: LoginPayload) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? 'Erro ao fazer login');
  }

  return res.json() as Promise<{ access_token: string }>;
}

export async function register(payload: RegisterPayload) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? 'Erro ao registrar');
  }

  return res.json();
}
