import { prisma } from "@/lib/prisma";
import UsuariosClient from "./_components/UsuariosClient";

export const revalidate = 0; // siempre fresco en desarrollo

export default async function UsuariosPage() {
  // Cargar roles para filtros y formulario
  const roles = await prisma.rol.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <UsuariosClient roles={roles} />
    </section>
  );
}
