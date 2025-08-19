import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear roles base
  for (const nombre of ["ADMIN", "EMPLEADO", "CLIENTE"]) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // Buscar rol ADMIN
  const adminRol = await prisma.rol.findUnique({
    where: { nombre: "ADMIN" },
  });
  if (!adminRol) throw new Error("No existe rol ADMIN");

  // Crear usuario admin por defecto
  const email = "admin@beso.com";
  const passwordHash = await bcrypt.hash("AdminBESO123!", 10);

  await prisma.usuario.upsert({
    where: { email },
    update: { password: passwordHash },
    create: {
      nombre: "Admin BESO",
      email,
      password: passwordHash,
      idRol: adminRol.idRol, // FK correcta según schema
      estado: "activo",
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
