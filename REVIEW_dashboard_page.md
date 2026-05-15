# Review de Código — `app/dashboard/page.tsx`

> Revisão baseada nos padrões de Clean Code e Clean Architecture definidos no guia de criação de páginas do projeto.

---

## Resultado geral

| Categoria                                    | Status               |
| -------------------------------------------- | -------------------- |
| Clean Code                                   | ❌ Pontos obrigatórios |
| Nomenclatura                                 | ⚠️ Pontos a corrigir |
| Validação (Zod + RHF)                        | ❌ Ausente nos formulários |
| Arquitetura (separação de responsabilidades) | ❌ Viola Clean Architecture |
| Pronto para PR                               | ❌ Não               |

---

## Problemas obrigatórios (bloqueia PR)

### 1. Chamadas diretas à API nos componentes — extrair para hooks

**`SuperAdminHome` linha 72, `CompanyModal` linhas 298–301, `CreateAdminUserModal` linha 381, `UserDashboard` linhas 467–472**

`api.get`, `api.post`, `api.patch` e `api.delete` são chamados diretamente nos componentes. O guia exige que toda comunicação com a API passe exclusivamente pelo hook:

```
page.tsx → hook → api
```

Os tipos `Company`, `Stats` e `OverdueEntry` (linhas 23–35) também estão definidos no `page.tsx`. Devem ser exportados pelo hook e importados pelos componentes.

**Correção:** criar hooks dedicados — por exemplo, `hooks/useCompanies.ts` e `hooks/useDashboardStats.ts` — com `useQuery`/`useMutation` do React Query, expondo dados e mutações. O componente apenas consome o que o hook retorna.

---

### 2. Booleano `loading` sem prefixo `is`

**Linhas 65, 279, 368**

```ts
// ❌
const [loading, setLoading] = useState(true);
```

O guia exige que booleanos comecem com `is`, `has` ou `can`.

```ts
// ✅
const [isLoading, setIsLoading] = useState(true);
```

---

### 3. Abreviações obscuras em helpers e estado

**Linha 41 — variável `h`**
**Linha 48 — função `fmt` e parâmetro `v`**
**Linha 367 — setter `setPass`**

```ts
// ❌
const h = new Date().getHours();
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const [password, setPass] = useState('');
```

Nomes devem revelar intenção; abreviações de uma letra são proibidas.

```ts
// ✅
const hour = new Date().getHours();
const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const [password, setPassword] = useState('');
```

`formatCurrency` deve ser movido para `lib/utils.ts` ao lado de `formatPhone` e `formatCPF`, que já vivem lá.

---

### 4. `<a>` nativo em vez de `<Link>` do Next.js

**Linhas 596–612**

```tsx
// ❌ causa reload completo da página, perde o estado do cliente
<a href={href} className="...">
```

Em Next.js use `Link` de `next/link` para navegação client-side:

```tsx
// ✅
import Link from 'next/link';
// ...
<Link href={href} className="...">
```

---

### 5. Handlers inline com bloco `{}` e múltiplas statements

**Linhas 188, 195, 200–201**

```tsx
// ❌ bloco {} com 2 statements — deve ser função nomeada
onSuccess={() => { setCreateOpen(false); load(); }}
onSuccess={() => { setEditCompany(null); load(); }}
onSuccess={() => { setUserTarget(null); load(); }}
```

O guia permite inline apenas quando é **uma expressão**, sem chaves de bloco. Com múltiplas statements, extraia para funções nomeadas:

```ts
// ✅
const handleCreateSuccess = () => { setCreateOpen(false); load(); };
const handleEditSuccess   = () => { setEditCompany(null); load(); };
const handleUserSuccess   = () => { setUserTarget(null); load(); };
```

---

## Pontos de melhoria (não bloqueiam, mas valem atenção)

### 6. Formulários sem Zod + react-hook-form

`CompanyModal` (linhas 291–305) e `CreateAdminUserModal` (linhas 376–389) fazem validação manual com `if (!name.trim())` e múltiplos `useState` por campo.

O padrão do projeto é Zod + react-hook-form:

```ts
const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;
```

Isso elimina os `useState` individuais por campo e centraliza a validação em uma fonte única de verdade.

---

### 7. Seis componentes no mesmo arquivo — separar em arquivos próprios

O arquivo contém: `DashboardPage`, `SuperAdminHome`, `CompanyCard`, `CompanyModal`, `CreateAdminUserModal` e `UserDashboard`. O princípio de responsabilidade única exige um componente por arquivo.

Estrutura sugerida:

```
app/dashboard/
├── page.tsx                          ← apenas DashboardPage (entry point)
├── user-dashboard.tsx
└── super-admin/
    ├── super-admin-home.tsx
    ├── company-card.tsx
    ├── company-modal.tsx
    └── create-admin-user-modal.tsx
```

---

### 8. Tipos definidos no `page.tsx` em vez do hook

**Linhas 23–35:** `Company`, `Stats` e `OverdueEntry` estão no `page.tsx`. Quando os hooks forem extraídos (ponto 1), defina e exporte os tipos a partir do hook — fonte única de verdade para o modelo.

```ts
// hooks/useCompanies.ts
export interface Company { ... }
```

---

### 9. `load` sem `useCallback` em `SuperAdminHome`

**Linha 70**

A função `load` é recriada a cada render e referenciada tanto pelo `useEffect` quanto pelo botão de refresh, o que pode gerar warnings do `eslint-plugin-react-hooks`.

```ts
// ✅
const load = useCallback(async () => {
  setIsLoading(true);
  try { setCompanies(await api.get<Company[]>('/admin/companies')); }
  finally { setIsLoading(false); }
}, []);

useEffect(() => { load(); }, [load]);
```

---

### 10. `getPayload()` chamado duas vezes desnecessariamente

**Linhas 53 e 63**

`DashboardPage` chama `getPayload()` para checar `isSuperAdmin` e renderiza `<SuperAdminHome />`. Dentro de `SuperAdminHome`, `getPayload()` é chamado novamente para obter `payload.name`. Passe o valor como prop para evitar a chamada dupla:

```tsx
// ✅
if (payload?.isSuperAdmin) return <SuperAdminHome payload={payload} />;
```

---

### 11. Comentários de seção descritivos — remover antes do PR

**Linhas 21, 37, 50, 58, 85, 110, 139, 436, 487, 509, 533, 589**

```tsx
// ─── Types ────────────────────────────────────────────────────────────────────
// ─── Helpers ──────────────────────────────────────────────────────────────────
// ─── Entry point ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
{/* ── Hero ── */}
{/* ── KPIs ── */}
{/* ── Companies ── */}
{/* ── Stats ── */}
{/* ── Overdue ── */}
{/* ── Quick links ── */}
```

O guia proíbe comentários que descrevem "o que" o código faz — o próprio JSX e os nomes dos componentes já tornam isso claro. Remova todos antes do PR.

---

## Checklist para o PR

**Obrigatório**

- [ ] Extrair chamadas de API para hooks dedicados (`useCompanies`, `useDashboardStats`)
- [ ] Mover tipos `Company`, `Stats`, `OverdueEntry` para os hooks correspondentes
- [ ] Renomear `loading` → `isLoading` em todos os componentes (linhas 65, 279, 368)
- [ ] Renomear `h` → `hour` (linha 41)
- [ ] Renomear `fmt` → `formatCurrency` e `v` → `value` (linha 48) e mover para `lib/utils.ts`
- [ ] Renomear `setPass` → `setPassword` (linha 367)
- [ ] Substituir `<a href>` por `<Link href>` do Next.js (linhas 596–612)
- [ ] Extrair handlers inline com bloco `{}` para funções nomeadas (linhas 188, 195, 200)
- [ ] Remover comentários de seção descritivos (linhas 21, 37, 50, 58, 85, 110, 139, 436, 487, 509, 533, 589)

**Recomendado**

- [ ] Migrar formulários de `CompanyModal` e `CreateAdminUserModal` para Zod + react-hook-form
- [ ] Separar os 6 componentes em arquivos próprios
- [ ] Adicionar `useCallback` à função `load` em `SuperAdminHome`
- [ ] Passar `payload` como prop para `SuperAdminHome` para evitar chamada dupla de `getPayload()`
