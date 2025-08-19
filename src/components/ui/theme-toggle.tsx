"use client";

import { useEffect, useState } from "react";

/**
 * Toggle de tema que alterna la clase `data-theme="dark|light"` en <html>
 * y persiste la preferencia en localStorage.
 * Muestra ☀️ para claro y 🌙 para oscuro.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";

  useEffect(() => {
    // leer preferencia
    const saved =
      (typeof window !== "undefined" &&
        (localStorage.getItem("theme") as "light" | "dark" | null)) ||
      null;

    // si no hay preferencia, respeta media query
    const prefersDark =
      !saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={toggle}
      className="icon-button"
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? (
        // ☀️
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 4V2m0 20v-2M4.93 4.93 3.51 3.51m16.98 16.98-1.42-1.42M4 12H2m20 0h-2M4.93 19.07 3.51 20.49m16.98-16.98-1.42 1.42M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // 🌙
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
