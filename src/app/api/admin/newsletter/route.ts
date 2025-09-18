import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Dir = "asc" | "desc";
type OrderField = "id" | "fecha" | "email";

const isEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim().toLowerCase());

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const activoParam = searchParams.get("activo");
  const order = (searchParams.get("order") ?? "fecha") as OrderField;
  const dir: Dir =
    (searchParams.get("dir") ?? "desc") === "asc" ? "asc" : "desc";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  const where: Prisma.SuscriptorNewsletterWhereInput = {};

  if (q) {
    where.OR = [{ email: { contains: q } }];
  }
  if (activoParam === "true") where.activo = true;
  if (activoParam === "false") where.activo = false;

  if (desde || hasta) {
    const rango: Prisma.DateTimeFilter = {};
    if (desde) rango.gte = new Date(`${desde}T00:00:00`);
    if (hasta) rango.lte = new Date(`${hasta}T23:59:59`);
    where.creado_en = rango;
  }

  const orderBy:
    | Prisma.SuscriptorNewsletterOrderByWithRelationInput
    | Prisma.SuscriptorNewsletterOrderByWithRelationInput[] =
    order === "id"
      ? { id: dir }
      : order === "email"
      ? { email: dir }
      : { creado_en: dir };

  const data = await prisma.suscriptorNewsletter.findMany({
    where,
    orderBy,
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const { email, activo } = (await req.json()) as {
      email?: string;
      activo?: boolean;
    };
    const e = (email ?? "").trim().toLowerCase();
    if (!isEmail(e)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    const created = await prisma.suscriptorNewsletter.create({
      data: { email: e, activo: typeof activo === "boolean" ? activo : true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Error al crear suscriptor" },
      { status: 400 }
    );
  }
}
