import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ─── Shared types ───────────────────────────────────────────────────────────

export type Role = { id: string; name: string };
export type CompanyRef = { id: string; name: string };

export type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  _count: { users: number; clients: number; sales: number };
};

export type AdminUser = {
  id: string; name: string; email: string; phone: string | null;
  cpf: string | null; active: boolean; role: Role; company: CompanyRef; createdAt: string;
};

export type DashboardUser = {
  id: string; name: string; email: string; cpf: string | null;
  phone: string | null; address: string | null; description: string | null;
  active: boolean; role: Role; createdAt: string;
};

export type CompanyAnalytics = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  ageDays: number;
  counts: { users: number; clients: number; products: number; sales: number };
  revenue: { total: number; last30Days: number; avgTicket: number };
  activity: { salesLast30Days: number; salesLast7Days: number };
  score: number;
};

export type Analytics = {
  totals: {
    companies: number; users: number; clients: number; products: number;
    sales: number; revenue: number; revenueLast30Days: number; salesLast30Days: number;
  };
  companies: CompanyAnalytics[];
};

export type OverdueEntry = {
  client: { id: string; name: string; phone: string | null; email: string | null };
  total: number;
  sales: { id: string; total: number; dueDate: string | null }[];
};

// ─── Query keys ─────────────────────────────────────────────────────────────

export const qk = {
  adminAnalytics: ['admin', 'analytics'] as const,
  adminCompanies: ['admin', 'companies'] as const,
  adminUsers: (companyId?: string) =>
    companyId ? (['admin', 'users', { companyId }] as const) : (['admin', 'users'] as const),
  users: ['users'] as const,
  roles: ['roles'] as const,
  clients: ['clients'] as const,
  clientsOverdue: ['clients', 'overdue'] as const,
};

// ─── Queries ────────────────────────────────────────────────────────────────

export function useAnalytics() {
  return useQuery({
    queryKey: qk.adminAnalytics,
    queryFn: () => api.get<Analytics>('/admin/analytics'),
  });
}

export function useAdminCompanies() {
  return useQuery({
    queryKey: qk.adminCompanies,
    queryFn: () => api.get<Company[]>('/admin/companies'),
  });
}

export function useAdminUsers(companyId?: string) {
  return useQuery({
    queryKey: qk.adminUsers(companyId),
    queryFn: () => {
      const qs = companyId ? `?companyId=${companyId}` : '';
      return api.get<AdminUser[]>(`/admin/users${qs}`);
    },
  });
}

export function useDashboardUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: () => api.get<DashboardUser[]>('/users'),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: qk.roles,
    queryFn: () => api.get<Role[]>('/roles'),
  });
}

export function useOverdueClients() {
  return useQuery({
    queryKey: qk.clientsOverdue,
    queryFn: () => api.get<OverdueEntry[]>('/clients/overdue').catch(() => [] as OverdueEntry[]),
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useDeactivateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useReactivateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}`, { active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeactivateDashboardUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}
