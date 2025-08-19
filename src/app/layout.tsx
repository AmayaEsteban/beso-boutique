"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/ui/header"; //header público
import "./globals.css";

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
        {/* Header público sólo si NO estamos en /admin */}
        {!isAdminRoute && <Header />}
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
