"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/ui/header"; // header público
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <html lang="es">
      <body>
        <SessionProvider>
          {/* Header público sólo si NO estamos en /admin */}
          {!isAdminRoute && <Header />}
          <main className="page">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
