import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcrypt";

// Seeds demo users (owner and staff) with securely hashed passwords.
export async function seedUsers(prisma: PrismaClient): Promise<User[]> {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@shelfsense.local" },
    update: {
      passwordHash,
      role: Role.OWNER,
      isActive: true,
    },
    create: {
      name: "Owner User",
      email: "owner@shelfsense.local",
      passwordHash,
      role: Role.OWNER,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@shelfsense.local" },
    update: {
      passwordHash,
      role: Role.STAFF,
      isActive: true,
    },
    create: {
      name: "Staff User",
      email: "staff@shelfsense.local",
      passwordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  return [owner, staff];
}
