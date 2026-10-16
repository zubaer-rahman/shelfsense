import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@shelfsense.local" },
    update: {},
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
    update: {},
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
