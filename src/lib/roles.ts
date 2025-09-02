import { prisma } from "@/lib/prisma";

/** Devuelve el id_rol del rol CLIENTE o lanza error si no existe */
export async function getClienteRoleId(): Promise<number> {
  const rol = await prisma.rol.findFirst({
    where: { nombre: "CLIENTE" },
    select: { idRol: true },
  });
  if (!rol) throw new Error('No existe el rol "CLIENTE" en la tabla roles.');
  return rol.idRol;
}
