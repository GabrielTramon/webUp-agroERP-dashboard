# Como criar uma nova página no agroERP Dashboard

Guia passo a passo baseado nos padrões reais do projeto.

Como referência, use `app/dashboard/users/` (página + dialog) ou `app/admin/companies/` como exemplos concretos.

> **AVISO — Revisão automática de código**
> Todo código criado com base neste guia será revisado por um agente Claude especializado em qualidade de código. O revisor verificará conformidade com os padrões deste projeto. Corrija os pontos levantados antes de abrir Pull Request.

---

## Visão geral da estrutura

Cada funcionalidade tem 2 arquivos:

```
app/
└── dashboard/          ← páginas do usuário comum
    └── minha-area/
        ├── page.tsx            # Página principal (tabela + controle de estado)
        └── minha-area-dialog.tsx  # Dialog de criação/edição

app/
└── admin/              ← páginas exclusivas do Super Admin
    └── minha-area/
        ├── page.tsx
        └── minha-area-dialog.tsx
```

A URL resultante depende de onde a pasta é criada:
- `app/dashboard/minha-area/` → `/dashboard/minha-area`
- `app/admin/minha-area/` → `/admin/minha-area`

---

## Padrões obrigatórios

Antes de escrever qualquer código, internalize as regras abaixo. O revisor vai verificar cada uma delas.

### Responsabilidade única

| Arquivo          | O que deve conter                                          | O que NÃO deve conter              |
| ---------------- | ---------------------------------------------------------- | ---------------------------------- |
| `page.tsx`       | estado da página, filtro, lista, controle do dialog        | lógica de formulário, campos de input |
| `*-dialog.tsx`   | campos do formulário, submit, validação básica             | estado da tabela, filtro de lista  |

### Nomenclatura

- Variáveis e funções: nomes que revelam intenção — `handleDeactivate`, não `onClick2`
- Booleanos começam com `is`, `has` ou `can`: `isLoading`, `isOpen`, `hasError`
- Evite abreviações: `isLoading`, não `loading`; `selectedUser`, não `sel`
- Variáveis de loop: evite `u`, `c`, `r` — use `user`, `company`, `role`

### O que remover antes de abrir PR

- Todos os `console.log`, `console.error` e `debugger`
- Código comentado (`// const x = ...`)
- Imports não utilizados
- `TODO` e `FIXME` sem resolução
- Props e variáveis declaradas e não usadas

### Handlers inline no JSX

Inline só é permitido quando for **uma única expressão sem chaves de bloco**:

```tsx
// ✅ uma expressão — permitido
onClick={() => setIsOpen(true)}

// ❌ bloco {} com múltiplos statements — extrair para função nomeada
onClick={() => { setEditing(user); setIsOpen(true); }}

// ✅ versão correta
const handleEditClick = (user: User) => {
  setEditing(user);
  setIsOpen(true);
};
// ...
onClick={() => handleEditClick(user)}
```

---

## Passo 1 — Criar a pasta e o `page.tsx`

Crie a pasta dentro da área correta e o arquivo da página.

```
app/dashboard/minha-area/
├── page.tsx
└── minha-area-dialog.tsx
```

### Estrutura do `page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MinhaAreaDialog } from './minha-area-dialog';

// 1. Tipos locais do modelo
type MinhaEntidade = {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: string;
};

export default function MinhaAreaPage() {
  const [itens, setItens]     = useState<MinhaEntidade[]>([]);
  const [isOpen, setIsOpen]   = useState(false);
  const [editing, setEditing] = useState<MinhaEntidade | null>(null);
  const [search, setSearch]   = useState('');

  // 2. Filtro local — sem chamada de API a cada keystroke
  const filtered = search.trim()
    ? itens.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()))
    : itens;

  // 3. Função de carregamento — chamada no mount e após mutações
  async function load() {
    setItens(await api.get<MinhaEntidade[]>('/minha-rota'));
  }

  useEffect(() => { load(); }, []);

  // 4. Handlers nomeados para ações que têm mais de 1 statement
  function handleOpenCreate() {
    setEditing(null);
    setIsOpen(true);
  }

  function handleOpenEdit(item: MinhaEntidade) {
    setEditing(item);
    setIsOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item?')) return;
    await api.delete(`/minha-rota/${id}`);
    load();
  }

  function handleSuccess() {
    setIsOpen(false);
    load();
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Minha Área</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{itens.length} item(s)</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo item
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>
                  <Badge variant={item.ativo ? 'default' : 'secondary'}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <MinhaAreaDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        item={editing}
      />
    </div>
  );
}
```

---

## Passo 2 — Criar o dialog (`*-dialog.tsx`)

O dialog centraliza os campos do formulário e o submit. Serve para criar e editar — controlado pela prop `item` (`null` = criar, objeto = editar).

```tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// Reutiliza o tipo definido no page.tsx ou redefine localmente
type MinhaEntidade = {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: MinhaEntidade | null;
}

export function MinhaAreaDialog({ open, onClose, onSuccess, item }: Props) {
  const [nome, setNome]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  // Popula os campos ao abrir o dialog
  useEffect(() => {
    if (open) {
      setNome(item?.nome ?? '');
      setError('');
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (item) {
        await api.put(`/minha-rota/${item.id}`, { nome });
      } else {
        await api.post('/minha-rota', { nome });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar item' : 'Novo item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Passo 3 — Registrar na navegação

### Área do dashboard (`/dashboard/*`)

Abra `components/app-sidebar.tsx` e adicione um objeto ao array de itens de menu:

```ts
{ title: 'Minha Área', url: '/dashboard/minha-area', icon: IconeAdequado }
```

O ícone deve vir de `lucide-react`. Veja os ícones já usados no arquivo para manter consistência.

### Área do admin (`/admin/*`)

Abra `app/admin/layout.tsx` e adicione ao array `navItems`:

```ts
{ title: 'Minha Área', href: '/admin/minha-area', icon: IconeAdequado, exact: false }
```

Se a rota for a raiz da seção (ex: `/admin` sem subrota), use `exact: true` para que o item ativo não "vaze" para subpáginas.

---

## Padrões de componentes UI

### Button com navegação (não use `asChild`)

O `Button` deste projeto usa `@base-ui/react` e **não suporta** `asChild`. Para links estilizados como botão, use `buttonVariants`:

```tsx
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

// ✅
<Link href="/dashboard/minha-area" className={buttonVariants({ size: 'sm' })}>
  Ver tudo
</Link>

// ❌ vai gerar erro de tipo
<Button asChild><Link href="...">Ver tudo</Link></Button>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={roleId} onValueChange={(value) => setRoleId(value ?? '')}>
  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
  <SelectContent>
    {roles.map((role) => (
      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Formatadores de input

```tsx
import { formatPhone, formatCPF } from '@/lib/utils';

<Input
  value={phone}
  onChange={(e) => setPhone(formatPhone(e.target.value))}
  placeholder="(11) 99999-9999"
  inputMode="numeric"
/>
```

---

## Padrões de API

Todas as chamadas usam o cliente centralizado de `@/lib/api`. Ele injeta o token JWT automaticamente.

```ts
import { api } from '@/lib/api';

// Busca
const itens = await api.get<MinhaEntidade[]>('/minha-rota');

// Criar
await api.post('/minha-rota', { nome });

// Editar parcialmente
await api.patch(`/minha-rota/${id}`, { nome });

// Editar completo
await api.put(`/minha-rota/${id}`, payload);

// Excluir
await api.delete(`/minha-rota/${id}`);
```

O cliente lança um `Error` com a mensagem retornada pela API em caso de falha. Capture com `try/catch` e exiba via estado `error`.

---

## Checklist rápido

**Estrutura**

- [ ] Pasta criada na área correta (`dashboard/` ou `admin/`)
- [ ] `page.tsx` com `'use client'` no topo
- [ ] `*-dialog.tsx` criado na mesma pasta
- [ ] Link adicionado à navegação (`app-sidebar.tsx` ou `app/admin/layout.tsx`)

**Clean Code — obrigatório antes do PR**

- [ ] Nenhum `console.log`, `console.error` ou `debugger`
- [ ] Nenhum código comentado
- [ ] Nenhum import não utilizado
- [ ] Nenhum `TODO` ou `FIXME` sem resolução
- [ ] Booleanos com prefixo `is`, `has` ou `can` (`isLoading`, não `loading`)
- [ ] Sem abreviações de uma letra em variáveis de estado ou funções (`user`, não `u`)
- [ ] Handlers com mais de 1 statement extraídos para funções nomeadas
- [ ] Nenhum `<Button asChild>` — use `buttonVariants` + `<Link>`
- [ ] Navegação entre rotas usa `<Link href>`, nunca `<a href>`

---

## Referências no código

| Arquivo                                          | Papel                                      |
| ------------------------------------------------ | ------------------------------------------ |
| `app/dashboard/users/page.tsx`                   | Exemplo de página com tabela e busca       |
| `app/dashboard/users/user-dialog.tsx`            | Exemplo de dialog com campos e Select      |
| `app/admin/companies/page.tsx`                   | Exemplo de página na área admin            |
| `app/admin/companies/company-dialog.tsx`         | Exemplo de dialog simples                  |
| `app/admin/layout.tsx`                           | Como adicionar item na sidebar do admin    |
| `components/app-sidebar.tsx`                     | Como adicionar item na sidebar do dashboard|
| `lib/api.ts`                                     | Cliente HTTP centralizado                  |
| `lib/auth.ts`                                    | Funções de autenticação e permissão        |
| `lib/utils.ts`                                   | `formatPhone`, `formatCPF`, `cn`           |
| `components/ui/button.tsx`                       | Button + `buttonVariants`                  |
