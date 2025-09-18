// NO "use client" aquí
import type { ReactNode } from "react";

export const metadata = {
  title: "Newsletter | BESO Boutique",
  description: "Suscríbete para recibir novedades y promociones.",
};

export default function NewsletterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
