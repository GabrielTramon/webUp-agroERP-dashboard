"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
<<<<<<< HEAD
import { LogOut, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { logout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};
=======
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Users, UserCircle, Shield, KeyRound, LayoutDashboard,
  ShoppingBasket, TrendingUp, Landmark, BarChart2, LogOut, Moon, Sun,
} from "lucide-react";
import { logout } from "@/lib/api";
import { getPayload, hasPermission, type TokenPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navDefinitions = [
  { title: "Dashboard",   slug: "",               icon: LayoutDashboard, permission: "dashboard:acessar"    },
  { title: "Usuários",    slug: "/users",          icon: Users,           permission: "usuarios:visualizar"  },
  { title: "Clientes",    slug: "/clients",        icon: UserCircle,      permission: "clientes:visualizar"  },
  { title: "Produtos",    slug: "/products",       icon: ShoppingBasket,  permission: "produtos:visualizar"  },
  { title: "Vendas",      slug: "/sales",          icon: TrendingUp,      permission: "vendas:visualizar"    },
  { title: "Caixa",       slug: "/cash-register",  icon: Landmark,        permission: "caixa:visualizar"     },
  { title: "Financeiro",  slug: "/financial",      icon: BarChart2,       permission: "financeiro:visualizar" },
  { title: "Perfis",      slug: "/roles",          icon: Shield,          permission: "perfis:visualizar"    },
  { title: "Permissões",  slug: "/permissions",    icon: KeyRound,        permission: "perfis:visualizar"    },
];
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a

export type SidebarSection = {
  label: string;
  items: SidebarNavItem[];
};

interface Props {
  sections: SidebarSection[];
}

export function AppSidebar({ sections }: Props) {
  const router = useRouter();
  const pathname = usePathname();
<<<<<<< HEAD
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
=======
  const router   = useRouter();
  const params   = useParams<{ company?: string }>();
  const company  = params.company ?? '';

  type NavItem = (typeof navDefinitions)[0] & { href: string };

  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [visible, setVisible] = useState<NavItem[]>([]);
  const [isDark, setIsDark]   = useState(false);

  useEffect(() => {
    const p = getPayload();
    setPayload(p);
    setVisible(
      navDefinitions
        .filter((item) => hasPermission(item.permission))
        .map((item) => ({ ...item, href: `/dashboard/${company}${item.slug}` })),
    );

    const saved = localStorage.getItem("theme") === "dark";
    setIsDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, [company]);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleLogout() {
    logout();
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
    router.replace("/login");
  }

  return (
<<<<<<< HEAD
    <Sidebar className="border-r">
      <SidebarHeader className="flex flex-col items-center justify-center py-4 border-b">
=======
    <aside className="w-60 shrink-0 border-r bg-background flex flex-col">
      <div className="flex items-center justify-center px-5 py-4 border-b">
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
        <Image
          src="/logo.png"
          alt="Logo"
          width={72}
          height={72}
          priority
          className="block dark:hidden object-contain"
        />
        <Image
          src="/logo-white.png"
          alt="Logo"
          width={72}
          height={72}
          priority
          className="hidden dark:block object-contain"
        />
      </div>

<<<<<<< HEAD
      <SidebarContent className="px-2 py-4">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/admin" &&
                      pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
=======
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        ))}
      </nav>

      {payload && (
        <div className="border-t px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{payload.name}</span>
            <span className="text-xs text-muted-foreground truncate">{payload.email}</span>
          </div>
          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
>>>>>>> 141133b1b4128fa53cc79e887335ab94e09bb68a
  );
}
