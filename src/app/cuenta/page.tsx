"use client";

import { useSession } from "next-auth/react";

export default function CuentaPage() {
  const { data } = useSession();
  const nameOrEmail = (
    data?.user?.name ??
    data?.user?.email ??
    "Mi cuenta"
  ).toString();

  return (
    <section className="panel" style={{ padding: 16 }}>
      <h1 className="text-2xl font-bold mb-2">Mis datos</h1>
      <p className="muted mb-4">
        Aquí podrás ver y actualizar tus datos de cuenta.
      </p>

      <div className="grid gap-2">
        <div>
          <b>Nombre/Correo:</b> {nameOrEmail}
        </div>
        {/* Aquí luego colocaremos el formulario de perfil del cliente */}
      </div>
    </section>
  );
}
