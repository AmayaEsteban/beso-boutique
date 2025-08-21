import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * - productos: total de productos
 * - clientes: total de clientes
 * - ordenesHoy: ventas/órdenes de HOY
 * - ingresosHoy: suma de total HOY (si tu modelo Venta tiene "total")
 * - ingresosSemana: arreglo de 7 días con sumas por día
 * - ingresosSemanaTotal: suma de la semana
 * - lowStock: top 5 productos con stock bajo
 */
export async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const LOW_STOCK_THRESHOLD = 5;

  // Ejecuta todo en paralelo
  const [
    productos,
    clientes,
    ordenesHoy,
    ingresosHoyAgg,
    ingresosGroup,
    lowStockRaw,
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.cliente.count(),
    prisma.venta.count({
      where: { fecha: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.venta.aggregate({
      _sum: { total: true },
      where: { fecha: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.venta.groupBy({
      by: ["fecha"],
      where: { fecha: { gte: subDays(todayStart, 6), lte: todayEnd } },
      _sum: { total: true },
    }),
    prisma.producto.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, nombre: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const ingresosHoy = Number(ingresosHoyAgg._sum.total ?? 0);

  // Serie de 7 días (hoy y 6 atrás)
  const serie = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(todayStart, 6 - i);
    const ymd = d.toISOString().slice(0, 10);
    const match = ingresosGroup.find(
      (g) => g.fecha.toISOString().slice(0, 10) === ymd
    );
    return { date: ymd, total: Number(match?._sum.total ?? 0) };
  });

  const ingresosSemanaTotal = serie.reduce((acc, d) => acc + d.total, 0);

  return {
    productos,
    clientes,
    ordenesHoy,
    ingresosHoy,
    ingresosSemana: serie, // [{date:'YYYY-MM-DD', total:number}, ...]
    ingresosSemanaTotal,
    lowStock: lowStockRaw, // [{id, nombre, stock}, ...]
  };
}
