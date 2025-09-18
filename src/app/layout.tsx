"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/ui/header";
import FooterCMS from "@/components/ui/FooterCMS";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import LoginModalProvider from "@/app/_providers/LoginModalProvider";

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

          {/* Provider del modal de login (sólo sitio público) */}
          {!isAdminRoute ? (
            <LoginModalProvider>
              <main className="page">{children}</main>
            </LoginModalProvider>
          ) : (
            <main className="page">{children}</main>
          )}

          {/* Footer CMS sólo en el sitio público */}
          {!isAdminRoute && <FooterCMS />}
        </SessionProvider>
      </body>
    </html>
  );
}
