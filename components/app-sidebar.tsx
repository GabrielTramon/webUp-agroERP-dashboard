"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, UserCircle, Shield, KeyRound, LayoutDashboard,
  ShoppingBasket, TrendingUp, Landmark, BarChart2, LogOut, Moon, Sun,
} from "lucide-react";
import { logout } from "@/lib/api";
import { getPayload, hasPermission, type TokenPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

const allItems = [
  { title: "Dashboard",   href: "/dashboard",               icon: LayoutDashboard, permission: "dashboard:acessar"   },
  { title: "Usuários",    href: "/dashboard/users",          icon: Users,           permission: "usuarios:visualizar" },
  { title: "Clientes",    href: "/dashboard/clients",        icon: UserCircle,      permission: "clientes:visualizar" },
  { title: "Produtos",    href: "/dashboard/products",       icon: ShoppingBasket,  permission: "produtos:visualizar" },
  { title: "Vendas",      href: "/dashboard/sales",          icon: TrendingUp,      permission: "vendas:visualizar"   },
  { title: "Caixa",       href: "/dashboard/cash-register",  icon: Landmark,        permission: "caixa:visualizar"    },
  { title: "Financeiro",  href: "/dashboard/financial",      icon: BarChart2,       permission: "financeiro:visualizar"},
  { title: "Perfis",      href: "/dashboard/roles",          icon: Shield,          permission: "perfis:visualizar"   },
  { title: "Permissões",  href: "/dashboard/permissions",    icon: KeyRound,        permission: "perfis:visualizar"   },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [visible, setVisible] = useState<typeof allItems>([]);
  const [isDark, setIsDark]   = useState(false);

  useEffect(() => {
    const p = getPayload();
    setPayload(p);
    setVisible(allItems.filter((item) => hasPermission(item.permission)));

    const saved = localStorage.getItem("theme") === "dark";
    setIsDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="w-60 shrink-0 border-r bg-background flex flex-col">
      <div className="flex items-center justify-center px-5 py-4 border-b">
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
  );
}
