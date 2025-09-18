// src/app/api/productos/[id]/resenas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

const toId = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};
const isEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

export async function GET(_req: Request, { params }: Params) {
  const idProducto = toId(params.id);
  if (!Number.isFinite(idProducto)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const list = await prisma.resenaProducto.findMany({
    where: { idProducto, aprobado: true },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request, { params }: Params) {
  const idProducto = toId(params.id);
  if (!Number.isFinite(idProducto)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // Body estrictamente tipado y validado (sin any)
  const raw: unknown = await req.json();
  if (!isRecord(raw)) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const nombre = typeof raw.nombre === "string" ? raw.nombre.trim() : "";
  const emailRaw =
    typeof raw.email === "string" && raw.email.trim() !== ""
      ? raw.email.trim()
      : null;
  const comentario =
    typeof raw.comentario === "string" && raw.comentario.trim() !== ""
      ? raw.comentario.trim()
      : null;

  // rating puede venir como string o number → normalizamos a entero 1..5
  const ratingNum = (() => {
    if (typeof raw.rating === "number") return Math.trunc(raw.rating);
    if (typeof raw.rating === "string") {
      const n = Number.parseInt(raw.rating, 10);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  })();

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { error: "Calificación inválida (1 a 5)" },
      { status: 400 }
    );
  }
  if (emailRaw && !isEmail(emailRaw)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const created = await prisma.resenaProducto.create({
    data: {
      idProducto,
      nombre,
      email: emailRaw,
      rating: ratingNum,
      comentario,
      // aprobado y fecha usan los @default del modelo
    },
  });

  return NextResponse.json(created, { status: 201 });
}
