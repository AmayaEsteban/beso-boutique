import { z } from "zod";

export const userCreateSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  idRol: z.coerce.number().int().positive("Rol requerido"),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
});

export const userUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  // password es opcional en edición; si viene, se rehace hash
  password: z.string().min(6).optional(),
  idRol: z.coerce.number().int().positive().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});
