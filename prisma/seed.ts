import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@klikmoment.com";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.ADMIN,
      activated: true,
      name: "Admin",
    },
  });

  console.log("Admin created:", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
