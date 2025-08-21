// src/app/admin/page.tsx
import { getDashboardStats } from "./_data/getDashboardStats";

type KPI = { title: string; value: string; helper?: string };

const SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export default async function AdminDashboardPage() {
  // Datos reales
  const stats = await getDashboardStats();

  // === Generamos TUS arrays originales, pero con datos reales ===
  const KPIS: KPI[] = [
    {
      title: "Ventas del día",
      value: `Q ${stats.ingresosHoy.toLocaleString()}`,
    },
    { title: "Órdenes", value: `${stats.ordenesHoy}` },
    {
      title: "Ingresos",
      value: `Q ${stats.ingresosSemanaTotal.toLocaleString()}`,
      helper: "semana",
    },
  ];

  const STOCK_BAJO = stats.lowStock.map((p) => ({
    producto: p.nombre,
    stock: p.stock ?? 0,
  }));

  // Serie semanal -> alturas de barras (manteniendo tu SVG)
  const VENTAS = stats.ingresosSemana.map((d) => Math.round(d.total));

  // ======= A partir de aquí, es EXACTAMENTE tu UI original =======
  const max = Math.max(...VENTAS, 1);
  const bars = VENTAS.map((v, i) => {
    const h = (v / max) * 100;
    return { x: 20 + i * 36, height: h, label: SEMANA[i] };
  });

  return (
    <div className="container" style={{ display: "grid", gap: "1rem" }}>
      <section className="panel" style={{ padding: "1rem 1.25rem" }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: ".5rem" }}>Dashboard</h1>
        <p className="muted">Resumen general de la operación (datos reales).</p>
      </section>

      {/* KPIs */}
      <section
        style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr" }}
      >
        <div className="kpi-grid">
          {KPIS.map((k) => (
            <article key={k.title} className="card kpi">
              <div className="kpi__title">{k.title}</div>
              <div className="kpi__value">{k.value}</div>
              {k.helper ? (
                <div className="muted" style={{ fontSize: ".85rem" }}>
                  /{k.helper}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* Dos columnas: tabla + gráfico */}
      <section
        style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr" }}
      >
        <article className="card" style={{ padding: "1rem" }}>
          <h3 style={{ marginBottom: ".75rem" }}>Productos con stock bajo</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_BAJO.length === 0 ? (
                <tr>
                  <td colSpan={2} className="muted">
                    Todo con buen stock.
                  </td>
                </tr>
              ) : (
                STOCK_BAJO.map((r, i) => (
                  <tr key={i}>
                    <td>{r.producto}</td>
                    <td>{r.stock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="card" style={{ padding: "1rem" }}>
          <h3 style={{ marginBottom: ".75rem" }}>Ventas esta semana</h3>
          {/* Gráfico de barras simple en SVG */}
          <div style={{ width: "100%", height: 240 }}>
            <svg
              viewBox="0 0 300 200"
              style={{ width: "100%", height: "100%" }}
              aria-label="Gráfico de ventas semanal"
            >
              <line
                x1="10"
                y1="180"
                x2="290"
                y2="180"
                stroke="currentColor"
                opacity=".2"
              />
              {bars.map((b, idx) => (
                <g key={idx}>
                  <rect
                    x={b.x}
                    y={180 - b.height}
                    width="24"
                    height={b.height}
                    rx="6"
                    className="bg-beso"
                    fill="currentColor"
                    opacity=".9"
                  />
                  <text
                    x={b.x + 12}
                    y="195"
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    opacity=".7"
                  >
                    {b.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </article>
      </section>
    </div>
  );
}
