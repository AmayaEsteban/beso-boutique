// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/* ===== Tipos de entrada ===== */
type Body = {
  nombre?: string;
  apellidos?: string;
  email?: string;
  password?: string;
};

/* ===== Utilidades ===== */
const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/**
 * Obtiene el idRol para CLIENTE. Si no existe, intenta caer al id 3.
 * Lanza error si definitivamente no hay rol válido.
 */
async function getClienteRolId(): Promise<number> {
  const rol = await prisma.rol.findUnique({
    where: { nombre: "CLIENTE" },
    select: { idRol: true },
  });

  if (rol?.idRol) return rol.idRol;

  // fallback razonable (según tu dump el id 3 es CLIENTE)
  const fallback = await prisma.rol.findUnique({ where: { idRol: 3 } });
  if (fallback?.nombre?.toUpperCase() === "CLIENTE") return 3;

  throw new Error(
    "No existe el rol CLIENTE. Crea el rol en la tabla 'roles' o ajusta el id."
  );
}

/* ===== Handler ===== */
export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    const nombre = (body.nombre ?? "").trim();
    const apellidos = (body.apellidos ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    // Validaciones
    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }
    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Unicidad por email (usuarios)
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    // Rol CLIENTE
    const idRolCliente = await getClienteRolId();

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Nombre completo para la tabla clientes (tu tabla sólo tiene 'nombre')
    const nombreCliente = [nombre, apellidos].filter(Boolean).join(" ").trim();

    // Transacción: crear usuario y upsert de cliente
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre,
          apellidos: apellidos || null,
          email,
          password: hashed,
          idRol: idRolCliente,
          estado: "activo",
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          email: true,
          idRol: true,
        },
      });

      // clientes.email es UNIQUE en tu BD; upsert evita duplicados
      const cliente = await tx.cliente.upsert({
        where: { email },
        update: {
          nombre: nombreCliente || user.nombre,
          // Puedes inicializar teléfono/dirección en null; se completarán en checkout
        },
        create: {
          nombre: nombreCliente || user.nombre,
          email,
          telefono: null,
          direccion: null,
        },
        select: { id: true, nombre: true, email: true },
      });

      return { user, cliente };
    });

    // Éxito
    return NextResponse.json(
      {
        message: "Registro exitoso",
        userId: result.user.id,
        clienteId: result.cliente.id,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          (e as Error)?.message ??
          "Error inesperado al registrar. Intenta de nuevo.",
      },
      { status: 500 }
    );
  }
}
