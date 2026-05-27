import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { decodeJwt, isExpired } from "@/lib/jwt";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { AUTH_COOKIE } from "@/lib/server-config";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "AgroERP",
  description: "Sistema de gestão agrícola",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const payload = token ? decodeJwt(token) : null;
  const initialUser = payload && !isExpired(payload) ? payload : null;

  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
