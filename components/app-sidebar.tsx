"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  UserCircle,
  Shield,
  KeyRound,
  LayoutDashboard,
  ShoppingBasket,
  TrendingUp,
  Landmark,
} from "lucide-react";
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
import { getPayload, hasPermission, type TokenPayload } from "@/lib/auth";

const allItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:acessar",
  },
  {
    title: "Usuários",
    href: "/dashboard/users",
    icon: Users,
    permission: "usuarios:visualizar",
  },
  {
    title: "Clientes",
    href: "/dashboard/clients",
    icon: UserCircle,
    permission: "clientes:visualizar",
  },
  {
    title: "Produtos",
    href: "/dashboard/products",
    icon: ShoppingBasket,
    permission: "produtos:visualizar",
  },
  {
    title: "Vendas",
    href: "/dashboard/sales",
    icon: TrendingUp,
    permission: "vendas:visualizar",
  },
  {
    title: "Caixa",
    href: "/dashboard/cash-register",
    icon: Landmark,
    permission: "caixa:visualizar",
  },
  {
    title: "Roles",
    href: "/dashboard/roles",
    icon: Shield,
    permission: "perfis:visualizar",
  },
  {
    title: "Permissões",
    href: "/dashboard/permissions",
    icon: KeyRound,
    permission: "perfis:visualizar",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [visible, setVisible] = useState<typeof allItems>([]);

  useEffect(() => {
    const p = getPayload();
    setPayload(p);
    setVisible(allItems.filter((item) => hasPermission(item.permission)));
  }, []);

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex flex-col items-center justify-center py-2 border-b">
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
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visible.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {payload && (
        <SidebarFooter className="border-t px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate">{payload.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {payload.email}
            </span>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
