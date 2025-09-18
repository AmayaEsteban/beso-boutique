// src/lib/auth.ts
import { cookies } from "next/headers";

/** Devuelve true si detecta sesión (sin any) */
export async function getIsLoggedInServer(): Promise<boolean> {
  const c = await cookies();
  return Boolean(
    c.get("__Secure-next-auth.session-token")?.value ||
      c.get("next-auth.session-token")?.value ||
      c.get("session")?.value ||
      c.get("auth")?.value ||
      c.get("beso_session")?.value
  );
}
