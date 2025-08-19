import NextAuth, { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "EMPLEADO" | "CLIENTE";

declare module "next-auth" {
  /** Al usuario que devuelve authorize() le añadimos role */
  interface User {
    id: string;
    role: AppRole;
  }

  /** La sesión que recibe el cliente/servidor */
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Lo que guardamos en el token JWT */
  interface JWT {
    id: string;
    role: AppRole;
    name?: string | null;
    email?: string | null;
  }
}
