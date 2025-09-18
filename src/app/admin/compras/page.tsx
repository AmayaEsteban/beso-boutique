"use client";

import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

/* ===== Tipos ===== */
type Dir = "asc" | "desc";
type OrderField = "fecha" | "id";

type Compra = {
  id: number;
  idProveedor: number;
  fecha: string; // ISO
  total: number;
  nota: string | null;
  proveedor?: { nombre: string } | null;
  _count?: { detalleCompras: number };
};

type PagoProveedor = {
  id: number;
  idCompra: number;
  monto: number;
  metodo: string | null;
  referencia: string | null;
  fecha: string; // ISO
  nota: string | null;
};

type CompraFull = Compra & {
  detalleCompras: {
    idProducto: number;
    idVariante: number | null;
    cantidad: number;
    precioUnitario: number;
    producto?: { nombre: string } | null;
    variante?: {
      sku: string | null;
      color?: { nombre: string } | null;
      talla?: { codigo: string } | null;
    } | null;
  }[];
  pagosProveedor: PagoProveedor[];
};

type Filtros = {
  proveedor: string;
  desde: string;
  hasta: string;
  order: OrderField;
  dir: Dir;
};

type ProveedorLite = { id: number; nombre: string };

/* === Variantes para selector === */
type VarianteLite = {
  id: number;
  idProducto: number;
  sku: string | null;
  producto: { nombre: string } | null;
  color?: { nombre: string } | null;
  talla?: { codigo: string } | null;
};

type ItemForm = {
  idVariante: string; // select (requerido)
  idProducto: number | null; // derivado de la variante
  cantidad: string; // numeric text
  precioUnitario: string; // numeric text
};

type FormCompra = {
  idProveedor: string;
  fecha: string; // yyyy-mm-dd
  nota: string;
  items: ItemForm[];
};

type FormPago = {
  monto: string;
  metodo: string;
  referencia: string;
  fecha: string; // yyyy-mm-dd
  nota: string;
};

/* ===== Icons ===== */
function PdfIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="7" y="17" fontSize="7" fontWeight="700">
        PDF
      </text>
    </svg>
  );
}
function ViewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5c-7.633 0-11 7-11 7s3.367 7 11 7 11-7 11-7-3.367-7-11-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LinkCatalogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Helpers ===== */
const to2 = (n: number) => n.toFixed(2);
const toInt = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : NaN;
};
const toNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ====== Página ====== */
export default function ComprasPage() {
  // Listas base
  const [rows, setRows] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorLite[]>([]);
  const [variantes, setVariantes] = useState<VarianteLite[]>([]);

  // Filtros
  const [filters, setFilters] = useState<Filtros>({
    proveedor: "",
    desde: "",
    hasta: "",
    order: "fecha",
    dir: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Paginación
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Detalle modal
  const [viewing, setViewing] = useState<CompraFull | null>(null);

  // Drawer crear
  const [openDrawer, setOpenDrawer] = useState(false);
  const [form, setForm] = useState<FormCompra>({
    idProveedor: "",
    fecha: todayISO(),
    nota: "",
    items: [
      { idVariante: "", idProducto: null, cantidad: "", precioUnitario: "" },
    ],
  });

  // Form pago dentro del modal
  const [formPago, setFormPago] = useState<FormPago>({
    monto: "",
    metodo: "",
    referencia: "",
    fecha: todayISO(),
    nota: "",
  });
  const resetFormPago = () =>
    setFormPago({
      monto: "",
      metodo: "",
      referencia: "",
      fecha: todayISO(),
      nota: "",
    });

  // Carga inicial
  useEffect(() => {
    void load();
    void loadProveedores();
    void loadVariantesLite();
  }, []);

  const load = async () => {
    const sp = new URLSearchParams();
    if (filters.proveedor) sp.set("proveedor", filters.proveedor);
    if (filters.desde) sp.set("desde", filters.desde);
    if (filters.hasta) sp.set("hasta", filters.hasta);
    sp.set("order", filters.order);
    sp.set("dir", filters.dir);
    const res = await fetch(`/api/admin/compras?${sp.toString()}`);
    const data = (await res.json()) as Compra[];
    setRows(data);
    setPage(1);
  };

  const loadProveedores = async () => {
    const res = await fetch(
      "/api/admin/proveedores?limit=500&fields=id,nombre"
    );
    const data = (await res.json()) as ProveedorLite[];
    setProveedores(data);
  };

  // Variantes (lite) para selector
  // ===== Tipos estrictos para el selector de variantes =====
  type VarianteLite = {
    id: number;
    idProducto: number;
    sku: string | null;
    producto: { nombre: string } | null;
    color: { nombre: string } | null;
    talla: { codigo: string } | null;
  };

  // ===== Guardas de tipo para objetos anidados =====
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  const num = (v: unknown): number | null => {
    const n =
      typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  // ===== Variantes (Lite) para selector =====
  const loadVariantesLite = async () => {
    try {
      const res = await fetch(
        "/api/admin/variantes?limit=1000&with=producto,color,talla"
      );
      if (!res.ok) {
        setVariantes([]);
        return;
      }

      const raw: unknown = await res.json();

      const list: VarianteLite[] = Array.isArray(raw)
        ? raw
            .map((r): VarianteLite | null => {
              if (!isRecord(r)) return null;

              const id = num(r.id);
              const idProducto = num(r.idProducto);
              const sku =
                typeof r.sku === "string" && r.sku.trim() ? r.sku : null;

              // producto
              const productoObj =
                "producto" in r && isRecord(r.producto) ? r.producto : null;
              const producto =
                productoObj && typeof productoObj.nombre === "string"
                  ? { nombre: productoObj.nombre }
                  : null;

              // color
              const colorObj =
                "color" in r && isRecord(r.color) ? r.color : null;
              const color =
                colorObj && typeof colorObj.nombre === "string"
                  ? { nombre: colorObj.nombre }
                  : null;

              // talla
              const tallaObj =
                "talla" in r && isRecord(r.talla) ? r.talla : null;
              const talla =
                tallaObj && typeof tallaObj.codigo === "string"
                  ? { codigo: tallaObj.codigo }
                  : null;

              if (id == null || idProducto == null) return null;

              return { id, idProducto, sku, producto, color, talla };
            })
            .filter((x): x is VarianteLite => x !== null)
        : [];

      setVariantes(list);
    } catch {
      setVariantes([]);
    }
  };

  /* paginación */
  const count = rows.length;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  /* ver detalle */
  const openView = async (c: Compra) => {
    const res = await fetch(`/api/admin/compras/${c.id}`);
    if (!res.ok) {
      alert("No se pudo cargar el detalle.");
      return;
    }
    const full = (await res.json()) as CompraFull;
    setViewing(full);
    resetFormPago();
  };

  /* refrescar el detalle (tras crear/eliminar pago) */
  const refreshViewing = async () => {
    if (!viewing) return;
    const res = await fetch(`/api/admin/compras/${viewing.id}`);
    if (!res.ok) return;
    const full = (await res.json()) as CompraFull;
    setViewing(full);
  };

  /* Export listado */
  const exportListPDF = () => {
    const doc = new jsPDF();
    doc.text("Compras - BESO", 14, 14);
    const body: RowInput[] = rows.map((c) => [
      c.id,
      new Date(c.fecha).toLocaleString(),
      c.proveedor?.nombre ?? `#${c.idProveedor}`,
      `Q ${to2(c.total)}`,
      c._count?.detalleCompras ?? 0,
      c.nota ?? "-",
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Fecha", "Proveedor", "Total", "Items", "Nota"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });
    doc.save("compras.pdf");
    alert("PDF de lista generado.");
  };

  /* Export detalle */
  interface JsPDFWithAutoTable {
    lastAutoTable?: { finalY: number };
  }
  const exportOnePDF = (c: CompraFull) => {
    const doc = new jsPDF();
    doc.text(`Compra #${c.id}`, 14, 14);

    const head: RowInput[] = [
      ["Fecha", new Date(c.fecha).toLocaleString()],
      ["Proveedor", c.proveedor?.nombre ?? `#${c.idProveedor}`],
      ["Total", `Q ${to2(c.total)}`],
      ["Nota", c.nota ?? "-"],
    ];
    autoTable(doc, {
      startY: 22,
      theme: "grid",
      head: [["Campo", "Valor"]],
      body: head,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [178, 76, 90] },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 125 } },
    });

    const y =
      (doc as unknown as JsPDFWithAutoTable).lastAutoTable?.finalY !== undefined
        ? (doc as unknown as JsPDFWithAutoTable).lastAutoTable!.finalY + 8
        : 32;

    const items: RowInput[] = c.detalleCompras.map((d) => {
      const varLabel = [
        d.variante?.sku ?? "",
        d.variante?.color?.nombre ? ` · ${d.variante?.color?.nombre}` : "",
        d.variante?.talla?.codigo ? ` · ${d.variante?.talla?.codigo}` : "",
      ].join("");
      return [
        (d.producto?.nombre ?? `#${d.idProducto}`) +
          (varLabel ? ` (${varLabel})` : ""),
        d.cantidad,
        Number(d.precioUnitario).toFixed(2),
        (d.cantidad * Number(d.precioUnitario)).toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Producto/Variante", "Cant.", "P. Unit", "Subtotal"]],
      body: items,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [178, 76, 90] },
    });

    const y2 =
      (doc as unknown as JsPDFWithAutoTable).lastAutoTable?.finalY !== undefined
        ? (doc as unknown as JsPDFWithAutoTable).lastAutoTable!.finalY + 8
        : 32;

    if (c.pagosProveedor?.length) {
      const pagosRows: RowInput[] = c.pagosProveedor.map((p) => [
        new Date(p.fecha).toLocaleDateString(),
        p.metodo ?? "-",
        p.referencia ?? "-",
        `Q ${to2(p.monto)}`,
        p.nota ?? "-",
      ]);
      autoTable(doc, {
        startY: y2,
        head: [["Fecha", "Método", "Ref.", "Monto", "Nota"]],
        body: pagosRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [178, 76, 90] },
      });
    }

    doc.save(`compra_${c.id}.pdf`);
    alert("PDF del detalle generado.");
  };

  /* ====== Crear compra (drawer) ====== */
  const openCreate = () => {
    setForm({
      idProveedor: "",
      fecha: todayISO(),
      nota: "",
      items: [
        { idVariante: "", idProducto: null, cantidad: "", precioUnitario: "" },
      ],
    });
    setOpenDrawer(true);
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { idVariante: "", idProducto: null, cantidad: "", precioUnitario: "" },
      ],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, patch: Partial<ItemForm>) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...f, items };
    });
  };

  const calcTotal = () =>
    form.items.reduce((acc, it) => {
      const qty = toNum(it.cantidad);
      const pu = toNum(it.precioUnitario);
      if (!Number.isFinite(qty) || !Number.isFinite(pu)) return acc;
      return acc + qty * pu;
    }, 0);

  const variantLabel = (v: VarianteLite) => {
    const base = v.producto?.nombre ?? `#${v.idProducto}`;
    const parts: string[] = [];
    if (v.color?.nombre) parts.push(v.color.nombre);
    if (v.talla?.codigo) parts.push(v.talla.codigo);
    if (v.sku) parts.push(v.sku);
    return `${base} · ${parts.join(" · ")}`;
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const idProveedor = toInt(form.idProveedor);
    if (!Number.isFinite(idProveedor)) {
      alert("Selecciona un proveedor.");
      return;
    }
    if (!form.items.length) {
      alert("Agrega al menos una variante.");
      return;
    }

    // Normalizamos items -> todos requieren variante
    const detalles = [];
    for (const [i, it] of form.items.entries()) {
      const idVariante = toInt(it.idVariante);
      const cantidad = toNum(it.cantidad);
      const precio = toNum(it.precioUnitario);

      if (!Number.isFinite(idVariante)) {
        alert(`Selecciona variante en fila ${i + 1}.`);
        return;
      }
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        alert(`Cantidad inválida en fila ${i + 1}.`);
        return;
      }
      if (!Number.isFinite(precio) || precio < 0) {
        alert(`Precio unitario inválido en fila ${i + 1}.`);
        return;
      }

      // Obtenemos idProducto de la variante seleccionada (lo traemos del listado cargado)
      const v = variantes.find((x) => x.id === idVariante);
      if (!v) {
        alert(`Variante no encontrada en fila ${i + 1}.`);
        return;
      }

      detalles.push({
        idProducto: v.idProducto, // requerido por schema
        idVariante: idVariante, // donde sumaremos stock
        cantidad,
        precioUnitario: precio,
      });
    }

    const payload = {
      idProveedor,
      fecha: form.fecha,
      nota: form.nota.trim() || null,
      detalles,
    } as const;

    const res = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "No se pudo crear la compra.");
      return;
    }

    setOpenDrawer(false);
    await load();
    alert("Compra registrada y stock actualizado.");
  };

  /* ====== Pagos: crear y eliminar ====== */
  const submitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewing) return;

    const monto = toNum(formPago.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      alert("Monto inválido.");
      return;
    }

    const payload = {
      idCompra: viewing.id,
      monto,
      metodo: formPago.metodo.trim() || null,
      referencia: formPago.referencia.trim() || null,
      fecha: formPago.fecha,
      nota: formPago.nota.trim() || null,
    } as const;

    const res = await fetch("/api/admin/pagos-proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "No se pudo registrar el pago.");
      return;
    }

    resetFormPago();
    await refreshViewing();
    await load();
    alert("Pago registrado.");
  };

  const deletePago = async (p: PagoProveedor) => {
    if (!confirm(`Eliminar pago de Q ${to2(p.monto)}?`)) return;
    const res = await fetch(`/api/admin/pagos-proveedor/${p.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err?.error ?? "No se pudo eliminar el pago.");
      return;
    }
    await refreshViewing();
    await load();
    alert("Pago eliminado.");
  };

  /* ====== Util pagos ====== */
  const totalPagado = (viewing?.pagosProveedor ?? []).reduce(
    (acc, p) => acc + p.monto,
    0
  );
  const saldo = viewing ? viewing.total - totalPagado : 0;

  /* ====== Render ====== */
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Compras</h1>

      {/* Barra superior */}
      <div className="panel p-4 mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="muted">Total: {count}</div>

          {/* Acceso rápido a Catálogo (abre el formulario de alta) */}
          <a
            className="btn ghost"
            href="/admin/catalogo?new=1"
            title="Abrir Catálogo para crear producto/variante"
          >
            <LinkCatalogIcon style={{ marginRight: 6 }} />
            Catálogo (nuevo)
          </a>

          {/* Paginación compacta en cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted">Ver:</span>
            <select
              className="input"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ width: 90 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="muted">
              {count === 0 ? 0 : start + 1}-{end} de {count}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn ghost"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            <button
              className="icon-btn"
              onClick={exportListPDF}
              title="Exportar PDF"
            >
              <PdfIcon />
            </button>
            <button className="btn primary" onClick={openCreate}>
              <PlusIcon style={{ marginRight: 8 }} />
              Nueva compra
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <input
              className="input"
              placeholder="ID Proveedor…"
              value={filters.proveedor}
              onChange={(e) =>
                setFilters((f) => ({ ...f, proveedor: e.target.value }))
              }
              style={{ width: 160 }}
            />
            <input
              className="input"
              type="date"
              value={filters.desde}
              onChange={(e) =>
                setFilters((f) => ({ ...f, desde: e.target.value }))
              }
              title="Desde"
            />
            <input
              className="input"
              type="date"
              value={filters.hasta}
              onChange={(e) =>
                setFilters((f) => ({ ...f, hasta: e.target.value }))
              }
              title="Hasta"
            />
            <span className="muted">Orden:</span>
            <select
              className="input"
              value={filters.order}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  order: e.target.value as OrderField,
                }))
              }
              style={{ width: 140 }}
            >
              <option value="fecha">Fecha</option>
              <option value="id">ID</option>
            </select>
            <select
              className="input"
              value={filters.dir}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dir: e.target.value as Dir }))
              }
              style={{ width: 110 }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button className="btn" onClick={load}>
              Filtrar
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="panel p-0">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Total</th>
              <th>Items</th>
              <th>Nota</th>
              <th style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{new Date(c.fecha).toLocaleString()}</td>
                <td>{c.proveedor?.nombre ?? `#${c.idProveedor}`}</td>
                <td>{`Q ${to2(c.total)}`}</td>
                <td>{c._count?.detalleCompras ?? 0}</td>
                <td>{c.nota ?? "-"}</td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    onClick={() => void openView(c)}
                  >
                    <ViewIcon />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted text-center p-4">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación inferior */}
      <div className="panel p-3 mt-3 flex items-center justify-between">
        <div className="muted">
          Mostrando {count ? start + 1 : 0}-{end} de {count}
        </div>
        <div className="flex gap-2 items-center">
          <span className="muted">Ver:</span>
          <select
            className="input"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ width: 90 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
          >
            « Anterior
          </button>
          <div className="muted">
            Página {pageSafe} / {totalPages}
          </div>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
          >
            Siguiente »
          </button>
        </div>
      </div>

      {/* Modal detalle */}
      {viewing && (
        <div
          className="modal-root"
          onClick={() => setViewing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 2000,
          }}
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              margin: "3% auto",
              padding: 20,
              borderRadius: 8,
              width: "min(980px, 96%)",
              maxHeight: "92vh",
              overflow: "auto",
              display: "grid",
              gap: 14,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Detalle de compra</h3>
              <div className="flex gap-2">
                <button
                  className="icon-btn"
                  onClick={() => exportOnePDF(viewing)}
                  title="Exportar PDF"
                >
                  <PdfIcon />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setViewing(null)}
                  title="Cerrar"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div
              className="panel p-3"
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              }}
            >
              <div>
                <b>ID:</b> {viewing.id}
              </div>
              <div>
                <b>Fecha:</b> {new Date(viewing.fecha).toLocaleString()}
              </div>
              <div>
                <b>Proveedor:</b>{" "}
                {viewing.proveedor?.nombre ?? `#${viewing.idProveedor}`}
              </div>
              <div>
                <b>Total:</b> Q {to2(viewing.total)}
              </div>
              <div className="md:col-span-4">
                <b>Nota:</b> {viewing.nota ?? "-"}
              </div>
            </div>

            <div className="panel p-0">
              <div className="p-3 font-semibold">Items</div>
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto / Variante</th>
                      <th style={{ width: 90 }}>Cant.</th>
                      <th style={{ width: 120 }}>P. Unit</th>
                      <th style={{ width: 120 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.detalleCompras.map((d, i) => {
                      const varBits = [
                        d.variante?.sku ?? "",
                        d.variante?.color?.nombre
                          ? ` · ${d.variante?.color?.nombre}`
                          : "",
                        d.variante?.talla?.codigo
                          ? ` · ${d.variante?.talla?.codigo}`
                          : "",
                      ].join("");
                      return (
                        <tr key={i}>
                          <td>
                            {(d.producto?.nombre ?? `#${d.idProducto}`) +
                              (varBits ? ` (${varBits})` : "")}
                          </td>
                          <td>{d.cantidad}</td>
                          <td>{to2(Number(d.precioUnitario))}</td>
                          <td>{to2(d.cantidad * Number(d.precioUnitario))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagos */}
            <div
              className="panel p-3"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                justifyContent: "flex-end",
              }}
            >
              <div className="muted">Pagado: Q {to2(totalPagado)}</div>
              <div className={saldo > 0 ? "badge warn" : "badge ok"}>
                Saldo: Q {to2(saldo)}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              <div className="panel p-3" style={{ display: "grid", gap: 10 }}>
                <div className="flex items-center justify-between">
                  <b>Pagos al proveedor</b>
                  <button className="btn ghost" onClick={refreshViewing}>
                    Refrescar
                  </button>
                </div>

                {viewing.pagosProveedor.length === 0 ? (
                  <div className="muted">No hay pagos registrados.</div>
                ) : (
                  <div style={{ maxHeight: 260, overflow: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Método</th>
                          <th>Ref.</th>
                          <th style={{ width: 120 }}>Monto</th>
                          <th style={{ width: 70 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {viewing.pagosProveedor.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.fecha).toLocaleDateString()}</td>
                            <td>{p.metodo ?? "-"}</td>
                            <td>{p.referencia ?? "-"}</td>
                            <td>{`Q ${to2(p.monto)}`}</td>
                            <td className="text-right">
                              <button
                                className="icon-btn danger"
                                title="Eliminar pago"
                                onClick={() => void deletePago(p)}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="panel p-3" style={{ display: "grid", gap: 10 }}>
                <b>Registrar pago</b>
                <form onSubmit={submitPago} className="grid gap-3">
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "1fr 1fr" }}
                  >
                    <label className="grid gap-1">
                      <span>Monto</span>
                      <input
                        className="input"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={formPago.monto}
                        onChange={(e) =>
                          setFormPago((f) => ({ ...f, monto: e.target.value }))
                        }
                        required
                      />
                    </label>
                    <label className="grid gap-1">
                      <span>Fecha</span>
                      <input
                        className="input"
                        type="date"
                        value={formPago.fecha}
                        onChange={(e) =>
                          setFormPago((f) => ({ ...f, fecha: e.target.value }))
                        }
                        required
                      />
                    </label>
                  </div>

                  <label className="grid gap-1">
                    <span>Método (opcional)</span>
                    <input
                      className="input"
                      placeholder="Transferencia / Efectivo / Otro"
                      value={formPago.metodo}
                      onChange={(e) =>
                        setFormPago((f) => ({ ...f, metodo: e.target.value }))
                      }
                    />
                  </label>

                  <label className="grid gap-1">
                    <span>Referencia (opcional)</span>
                    <input
                      className="input"
                      placeholder="N° transacción, cheque, etc."
                      value={formPago.referencia}
                      onChange={(e) =>
                        setFormPago((f) => ({
                          ...f,
                          referencia: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="grid gap-1">
                    <span>Nota (opcional)</span>
                    <input
                      className="input"
                      placeholder="Observaciones"
                      value={formPago.nota}
                      onChange={(e) =>
                        setFormPago((f) => ({ ...f, nota: e.target.value }))
                      }
                    />
                  </label>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={resetFormPago}
                    >
                      Limpiar
                    </button>
                    <button type="submit" className="btn primary">
                      Guardar pago
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer crear */}
      {openDrawer && (
        <div
          className="admin-right-drawer-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenDrawer(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.45)",
            }}
          />
          <div
            className="admin-right-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="document"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(720px, 92vw)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--stroke)",
              padding: 16,
              overflow: "auto",
              display: "grid",
              gridTemplateRows: "auto 1fr",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Nueva compra</h3>
              <button
                className="icon-btn"
                onClick={() => setOpenDrawer(false)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={submitCreate} className="grid gap-3">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <label className="grid gap-1">
                  <span>Proveedor</span>
                  <select
                    className="input"
                    value={form.idProveedor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idProveedor: e.target.value }))
                    }
                    required
                  >
                    <option value="">Seleccione…</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span>Fecha</span>
                  <input
                    className="input"
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fecha: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span>Nota (opcional)</span>
                <input
                  className="input"
                  value={form.nota}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nota: e.target.value }))
                  }
                  placeholder="Observaciones de la compra…"
                />
              </label>

              {/* Detalle por VARIANTE */}
              <div className="panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <b>Detalle</b>
                  <div className="flex items-center gap-2">
                    <a
                      className="btn ghost"
                      href="/admin/catalogo?new=1"
                      title="Crear nueva variante (Catálogo)"
                    >
                      <LinkCatalogIcon style={{ marginRight: 6 }} />
                      Crear variante
                    </a>
                    <button type="button" className="btn" onClick={addItem}>
                      <PlusIcon style={{ marginRight: 6 }} />
                      Agregar ítem
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  {form.items.map((it, idx) => {
                    const subtotal =
                      Number.isFinite(toNum(it.cantidad)) &&
                      Number.isFinite(toNum(it.precioUnitario))
                        ? toNum(it.cantidad) * toNum(it.precioUnitario)
                        : 0;

                    // versión de onChange que llena idProducto según la variante
                    const onChangeVariante = (val: string) => {
                      const idV = toInt(val);
                      if (!Number.isFinite(idV)) {
                        updateItem(idx, { idVariante: val, idProducto: null });
                        return;
                      }
                      const v = variantes.find((x) => x.id === idV);
                      updateItem(idx, {
                        idVariante: val,
                        idProducto: v ? v.idProducto : null,
                      });
                    };

                    return (
                      <div
                        key={idx}
                        className="grid gap-2 items-end"
                        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }}
                      >
                        <label className="grid gap-1">
                          <span>Variante</span>
                          <select
                            className="input"
                            value={it.idVariante}
                            onChange={(e) => onChangeVariante(e.target.value)}
                            required
                          >
                            <option value="">Seleccione…</option>
                            {variantes.map((v) => (
                              <option key={v.id} value={String(v.id)}>
                                {variantLabel(v)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-1">
                          <span>Cantidad</span>
                          <input
                            className="input"
                            inputMode="numeric"
                            pattern="^[0-9]+$"
                            placeholder="0"
                            value={it.cantidad}
                            onChange={(e) =>
                              updateItem(idx, { cantidad: e.target.value })
                            }
                            required
                          />
                        </label>

                        <label className="grid gap-1">
                          <span>P. Unit</span>
                          <input
                            className="input"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={it.precioUnitario}
                            onChange={(e) =>
                              updateItem(idx, {
                                precioUnitario: e.target.value,
                              })
                            }
                            required
                          />
                        </label>

                        <div className="grid gap-1">
                          <span className="muted">Subtotal</span>
                          <div
                            className="input"
                            style={{ pointerEvents: "none" }}
                          >
                            Q {to2(subtotal || 0)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Quitar"
                          onClick={() => removeItem(idx)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-3">
                  <div className="muted" style={{ marginRight: 8 }}>
                    Total:
                  </div>
                  <div className="badge ok">Q {to2(calcTotal())}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  Guardar compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
