// src/lib/userState.ts
export type Estado = "activo" | "inactivo";

// Usamos un singleton sobre 'global' para que no se pierda entre HMR en dev
const g = global as unknown as { __userEstado?: Map<number, Estado> };

if (!g.__userEstado) {
  g.__userEstado = new Map<number, Estado>();
}

export const userEstado = g.__userEstado;

/** Lee el estado actual del usuario; por defecto 'activo' si no está seteado */
export function getEstado(id: number): Estado {
  return userEstado.get(id) ?? "activo";
}

/** Cambia el estado de un usuario en memoria */
export function setEstado(id: number, estado: Estado) {
  userEstado.set(id, estado);
}
