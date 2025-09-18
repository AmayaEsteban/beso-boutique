// src/app/productos/[id]/_components/VariantPicker.tsx
"use client";

import React from "react";

/* ========= Tipos ========= */
type VariantPlain = {
  id: number;
  idProducto: number;
  idColor: number | null;
  idTalla: number | null;
  sku: string | null;
  precio: number | null;
  stock: number;
  imagenUrl: string | null;
  color: { id: number; nombre: string; hex: string | null } | null;
  talla: { id: number; codigo: string } | null;
};

type Props = {
  productoId: number;
  basePrice: number;
  variantes: VariantPlain[];
  publicado: boolean;
  canBuy: boolean;
  isLoggedIn: boolean;
};

function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12zM6 6l-1-3H2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props} aria-hidden>
      <path
        d="M12 21s-7-4.35-9.5-8A5.5 5.5 0 1112 7a5.5 5.5 0 119.5 6c-2.5 3.65-9.5 8-9.5 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const to2 = (n: number) => n.toFixed(2);

/* ====== Estilos chips ====== */
const brand = "var(--accent, #B24C5A)";
const LOW_STOCK = 5;

const chipBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 14,
  border: "2px solid var(--stroke, #E2E2E2)",
  background: "var(--panel, #fff)",
  color: "var(--ink, #222)",
  minWidth: 72,
  height: 44,
  fontWeight: 600,
  letterSpacing: 0.2,
  transition:
    "transform .06s ease, background .12s ease, color .12s ease, border .12s ease",
};
const chipSelected: React.CSSProperties = {
  ...chipBase,
  background: brand,
  border: `2px solid ${brand}`,
  color: "#fff",
  boxShadow: "0 0 0 4px rgba(178,76,90,.12)",
  transform: "translateY(-1px)",
};
const chipLow: React.CSSProperties = {
  ...chipBase,
  background: "#FFF8E6",
  border: "2px solid #F59E0B",
  color: "#92400E",
};
const chipOut: React.CSSProperties = {
  ...chipBase,
  background: "#FFF1F2",
  border: "2px solid #EF4444",
  color: "#B91C1C",
  opacity: 0.7,
  cursor: "not-allowed",
  textDecoration: "line-through",
};

export default function VariantPicker({
  productoId,
  basePrice,
  variantes,
  publicado,
  canBuy,
  isLoggedIn,
}: Props) {
  type TallaMini = {
    id: number;
    codigo: string;
    stock: number;
    precio?: number | null;
  };
  const tallas: TallaMini[] = React.useMemo(() => {
    const map = new Map<number, TallaMini>();
    for (const v of variantes) {
      const t = v.talla;
      if (!t) continue;
      const cur = map.get(t.id);
      if (!cur) {
        map.set(t.id, {
          id: t.id,
          codigo: t.codigo,
          stock: Math.max(0, v.stock ?? 0),
          precio: v.precio ?? null,
        });
      } else {
        cur.stock += Math.max(0, v.stock ?? 0);
        if (v.precio != null) {
          cur.precio =
            cur.precio == null ? v.precio : Math.min(cur.precio, v.precio);
        }
      }
    }
    return Array.from(map.values());
  }, [variantes]);

  const [tallaId, setTallaId] = React.useState<number | null>(() => {
    const withStock = tallas.find((t) => t.stock > 0);
    return withStock?.id ?? tallas[0]?.id ?? null;
  });

  const selectedTalla = tallas.find((t) => t.id === tallaId) ?? null;
  const maxQty = Math.max(0, selectedTalla?.stock ?? 0);
  const price = selectedTalla?.precio ?? basePrice;

  const [qty, setQty] = React.useState<number>(1);
  React.useEffect(() => {
    setQty((q) => {
      const top = maxQty || 1;
      if (q < 1) return 1;
      if (q > top) return top;
      return q;
    });
  }, [maxQty]);

  /** Abrir SOLO el modal global de login */
  const openLogin = (reason: "cart" | "wish") => {
    window.dispatchEvent(
      new CustomEvent("open-login-modal", { detail: { reason } })
    );
  };

  const handleAdd = async () => {
    if (!publicado || !canBuy) return;
    if (!isLoggedIn) {
      openLogin("cart");
      return;
    }
    if (!selectedTalla || maxQty <= 0) {
      alert("Selecciona una talla con stock.");
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId,
          tallaId: selectedTalla.id,
          cantidad: qty,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error ?? "No se pudo agregar al carrito.");
      }
      alert("Producto agregado a tu carrito.");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleWishlist = () => {
    if (!isLoggedIn) {
      openLogin("wish");
      return;
    }
    // TODO: integrar API real
    alert("Añadido a favoritos.");
  };

  return (
    <div className="panel p-3" style={{ display: "grid", gap: 16 }}>
      {/* Talla */}
      <div style={{ display: "grid", gap: 10 }}>
        <div className="flex items-center gap-2">
          <div className="font-semibold">Talla</div>
          <span
            title="Selecciona una talla para poder agregar al carrito"
            aria-label="Ayuda talla"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 999,
              border: "1px solid var(--stroke, #E2E2E2)",
              fontSize: 12,
              cursor: "help",
            }}
          >
            ?
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
            gap: 10,
          }}
        >
          {tallas.map((t) => {
            const selected = t.id === tallaId;
            const disabled = t.stock <= 0;

            let style: React.CSSProperties;
            if (disabled) style = chipOut;
            else if (!selected && t.stock <= LOW_STOCK) style = chipLow;
            else style = selected ? chipSelected : chipBase;

            return (
              <button
                key={t.id}
                type="button"
                style={style}
                onClick={() => !disabled && setTallaId(t.id)}
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`Talla ${t.codigo}`}
                title={
                  disabled
                    ? `Sin stock (${t.codigo})`
                    : t.stock <= LOW_STOCK
                    ? `Pocas unidades (${t.stock})`
                    : `Disponibles: ${t.stock}`
                }
              >
                {t.codigo}
              </button>
            );
          })}
          {tallas.length === 0 && (
            <span className="muted">Este producto no tiene tallas.</span>
          )}
        </div>
      </div>

      {/* Cantidad */}
      <div style={{ display: "grid", gap: 8 }}>
        <div className="font-semibold">Cantidad</div>
        <div className="flex items-center gap-10">
          <div
            className="input"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              width: 116,
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              className="btn ghost"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Disminuir"
              style={{ padding: "2px 8px" }}
            >
              –
            </button>
            <div
              aria-live="polite"
              style={{ minWidth: 14, textAlign: "center" }}
            >
              {qty}
            </div>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
              disabled={qty >= (maxQty || 1)}
              aria-label="Aumentar"
              style={{ padding: "2px 8px" }}
            >
              +
            </button>
          </div>

          <div className="muted">Disponible: {maxQty}</div>
        </div>
      </div>

      {/* Total */}
      <div
        className="panel"
        style={{
          background: "rgba(178,76,90,.06)",
          border: "1px solid rgba(178,76,90,.2)",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="muted">Total</div>
        <div className="text-xl font-semibold">
          Q {to2(price * Math.max(1, qty))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "grid", gap: 10 }}>
        <button
          type="button"
          className="btn primary"
          onClick={handleAdd}
          disabled={!publicado || !canBuy || maxQty <= 0}
          aria-label="Agregar al carrito"
          title={
            !publicado
              ? "No publicado"
              : maxQty <= 0
              ? "Sin stock"
              : "Agregar al carrito"
          }
          style={{
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <CartIcon /> Agregar
        </button>

        <button
          type="button"
          className="btn ghost"
          title="Añadir a favoritos"
          aria-label="Añadir a favoritos"
          onClick={handleWishlist}
          style={{
            height: 40,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <HeartIcon /> Añadir a favoritos
        </button>
      </div>
    </div>
  );
}
