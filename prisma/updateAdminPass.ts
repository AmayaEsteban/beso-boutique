// prisma/updateAdminPass.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@beso.com"; // <-- AJUSTA si tu admin usa otro correo
  const plain = "NuevaClaveSegura123!"; // <-- AJUSTA a la clave que quieras
  const hash = await bcrypt.hash(plain, 10);

  const user = await prisma.usuario.update({
    where: { email },
    data: { password: hash },
  });

  console.log("✅ Contraseña actualizada para:", user.email);
}

main()
  .catch((e) => {
    console.error("❌ Error actualizando contraseña:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
