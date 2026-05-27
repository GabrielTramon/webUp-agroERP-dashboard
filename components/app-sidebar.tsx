"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
    router.replace("/login");
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex flex-col items-center justify-center py-4 border-b">
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
  );
}
