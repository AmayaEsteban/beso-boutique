// Valida y tipa las credenciales del login
import { z } from "zod";

export const CredentialsSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type CredentialsInput = z.infer<typeof CredentialsSchema>;
