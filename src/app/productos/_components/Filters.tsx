// src/app/productos/_components/Filters.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Color = { id: number; nombre: string; hex: string | null };
type Talla = { id: number; codigo: string };
type Orden = "recientes" | "precio_asc" | "precio_desc";

type Props = {
  colores: Color[];
  tallas: Talla[];
  selectedColor?: number;
  selectedTalla?: number;
  selectedOrden?: Orden | undefined;
  q: string;
};

/* ---------------- Tooltip de ayuda ---------------- */
function Help({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span className="help-wrap" aria-label={title}>
      <span className="help-dot" tabIndex={0}>
        ?
      </span>
      <span className="help-bubble" role="tooltip">
        {children}
      </span>
      <style>{`
        .help-wrap{position:relative;display:inline-flex;margin-left:6px}
        .help-dot{
          width:18px;height:18px;border-radius:999px;
          display:inline-flex;align-items:center;justify-content:center;
          border:1px solid var(--stroke);color:var(--muted-ink);font-size:12px;
          cursor:help;user-select:none;line-height:1;background:transparent
        }
        .help-bubble{
          position:absolute;left:22px;top:50%;transform:translateY(-50%);
          background:var(--panel);color:var(--ink);border:1px solid var(--stroke);
          border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.3;
          min-width:180px;max-width:260px;box-shadow:0 8px 24px rgba(0,0,0,.12);
          opacity:0;visibility:hidden;transition:opacity .15s ease,visibility .15s ease;z-index:10
        }
        .help-wrap:hover .help-bubble, .help-wrap:focus-within .help-bubble{opacity:1;visibility:visible}
      `}</style>
    </span>
  );
}

/* ---------------- Píldoras (tallas) ---------------- */
function Pill({
  active,
  onClick,
  children,
  full,
  "aria-label": ariaLabel,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  full?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active ? "true" : "false"}
      aria-label={ariaLabel}
      onClick={onClick}
      className="pill"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 18,
        border: `2px solid ${active ? "var(--primary)" : "var(--stroke)"}`,
        background: active
          ? "color-mix(in srgb, var(--primary) 12%, transparent)"
          : "transparent",
        fontWeight: 600,
        width: full ? "100%" : undefined,
      }}
    >
      {children}
      <style>{`.pill:hover{border-color:var(--primary)}`}</style>
    </button>
  );
}

/* ---------------- Punto de color ---------------- */
const Dot = ({ hex }: { hex: string }) => (
  <span
    aria-hidden
    style={{
      width: 14,
      height: 14,
      borderRadius: 999,
      background: hex,
      border:
        hex?.toLowerCase() === "#fff" || hex?.toLowerCase() === "#ffffff"
          ? "1px solid rgba(0,0,0,.22)"
          : "none",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)",
      flex: "0 0 14px",
    }}
  />
);

export default function Filters({
  colores,
  tallas,
  selectedColor,
  selectedTalla,
  selectedOrden,
  q,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [text, setText] = React.useState(q);
  const [orden, setOrden] = React.useState<Orden>(selectedOrden ?? "recientes");

  React.useEffect(() => setText(q), [q]);
  React.useEffect(
    () => setOrden(selectedOrden ?? "recientes"),
    [selectedOrden]
  );

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(sp?.toString() ?? "");
    if (value && value.trim() !== "") next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setParam("q", text.trim() || undefined);
  };
  const clickTalla = (id?: number) =>
    setParam("talla", id ? String(id) : undefined);
  const changeOrden = (value: Orden) => {
    setOrden(value);
    setParam("orden", value);
  };
  const resetAll = () => router.push(pathname);

  /* ------- Combo de colores (dropdown con scroll) ------- */
  const [openColors, setOpenColors] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedColorObj = selectedColor
    ? colores.find((c) => c.id === selectedColor) || null
    : null;

  const chooseColor = (id?: number) => {
    setParam("color", id ? String(id) : undefined);
    setOpenColors(false);
    // devolver el foco al botón para UX/teclado
    btnRef.current?.focus();
  };

  React.useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (
        openColors &&
        !btnRef.current?.contains(t) &&
        !listRef.current?.contains(t)
      ) {
        setOpenColors(false);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpenColors(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [openColors]);

  return (
    <div
      className="panel"
      style={{
        padding: 18,
        borderRadius: 14,
        border: "1px solid var(--stroke)",
      }}
    >
      {/* Buscar */}
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold">Buscar</h3>
          <Help title="Ayuda búsqueda">
            Escribe parte del <b>nombre</b> o <b>descripción</b> y pulsa{" "}
            <b>Buscar</b> o Enter.
          </Help>
        </div>
        <form className="flex gap-3" onSubmit={submitSearch}>
          <input
            className="input flex-1"
            placeholder="Buscar productos..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn">
            Buscar
          </button>
        </form>
      </div>

      {/* Color - Combo con scroll */}
      <div className="mb-5">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-xl font-bold">Color</h3>
          <Help title="Ayuda color">
            Selecciona un color de la lista. La lista tiene desplazamiento si
            hay muchos colores.
          </Help>
        </div>

        <div style={{ position: "relative" }}>
          <button
            ref={btnRef}
            type="button"
            className="input"
            onClick={() => setOpenColors((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={openColors}
            aria-controls="color-listbox"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              <Dot hex={selectedColorObj?.hex ?? "#bbb"} />
              {selectedColorObj ? selectedColorObj.nombre : "Todos los colores"}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M7 10l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>

          {openColors && (
            <div
              ref={listRef}
              id="color-listbox"
              role="listbox"
              style={{
                position: "absolute",
                zIndex: 20,
                left: 0,
                right: 0,
                marginTop: 6,
                background: "var(--panel)",
                border: "1px solid var(--stroke)",
                borderRadius: 10,
                boxShadow: "0 12px 28px rgba(0,0,0,.12)",
                maxHeight: 260, // <- tamaño amigable
                overflow: "auto",
              }}
            >
              <button
                role="option"
                aria-selected={!selectedColor}
                className="color-opt"
                onClick={() => chooseColor(undefined)}
              >
                <Dot hex="#bbb" />
                <span>Todos los colores</span>
              </button>
              {colores.map((c) => (
                <button
                  key={c.id}
                  role="option"
                  aria-selected={selectedColor === c.id}
                  className="color-opt"
                  onClick={() => chooseColor(c.id)}
                >
                  <Dot hex={c.hex ?? "#bbb"} />
                  <span>{c.nombre}</span>
                </button>
              ))}
              <style>{`
                .color-opt{
                  width:100%;display:flex;align-items:center;gap:10px;
                  padding:10px 12px;background:transparent;border:0;text-align:left;
                  cursor:pointer
                }
                .color-opt:hover{background:color-mix(in srgb, var(--primary) 9%, transparent)}
                [aria-selected="true"]{background:color-mix(in srgb, var(--primary) 14%, transparent)}
              `}</style>
            </div>
          )}
        </div>
      </div>

      {/* Tallas – grilla compacta y alineada */}
      <div className="mb-5">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-xl font-bold">Talla</h3>
          <Help title="Ayuda talla">
            Muestra productos con <b>stock</b> en la talla seleccionada.
          </Help>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          <Pill
            full
            active={!selectedTalla}
            onClick={() => clickTalla(undefined)}
          >
            Todas
          </Pill>
          {tallas.map((t) => (
            <Pill
              key={t.id}
              full
              active={selectedTalla === t.id}
              onClick={() => clickTalla(t.id)}
            >
              {t.codigo}
            </Pill>
          ))}
        </div>
      </div>

      {/* Orden */}
      <div className="mb-5">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-xl font-bold">Ordenar por</h3>
          <Help title="Ayuda orden">
            Cambia el criterio de orden: recientes o por precio.
          </Help>
        </div>
        <select
          className="select w-full"
          value={orden}
          onChange={(e) => changeOrden(e.target.value as Orden)}
        >
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
      </div>

      <button className="btn btn--neutral w-full" onClick={resetAll}>
        Limpiar filtros
      </button>
    </div>
  );
}
