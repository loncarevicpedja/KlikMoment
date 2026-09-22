import { z } from "zod";
import { passwordSchema } from "@/lib/password";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const activateSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Lozinke se ne poklapaju",
  path: ["confirmPassword"],
});
