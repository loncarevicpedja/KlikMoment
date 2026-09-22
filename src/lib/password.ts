import bcrypt from "bcryptjs";
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(5, "Lozinka mora imati najmanje 5 karaktera")
  .regex(/[A-Z]/, "Lozinka mora sadržati bar jedno veliko slovo")
  .regex(/[0-9]/, "Lozinka mora sadržati bar jedan broj");

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
