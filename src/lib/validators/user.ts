// src/lib/validators/user.ts
import { z } from "zod";

export const userCreateSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto"),
  apellidos: z.string().trim().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  idRol: z.number().int().positive(),
  estado: z.enum(["activo", "inactivo"]),
  // opcionales
  dpi: z.string().trim().optional().nullable(),
  nit: z.string().trim().optional().nullable(),
  direccion: z.string().trim().optional().nullable(),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;
