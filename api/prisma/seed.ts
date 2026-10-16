import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seeds/users.seed";
import { seedSuppliers } from "./seeds/suppliers.seed";
import { seedProducts } from "./seeds/products.seed";
import { seedSalesAndMovements } from "./seeds/sales.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting modular database seeding...");

  // Phase 9: Demo users (one OWNER, one STAFF)
  const users = await seedUsers(prisma);
  console.log(`✓ Seeded ${users.length} demo users`);

  // Phase 9: 3 to 4 suppliers
  const suppliers = await seedSuppliers(prisma);
  console.log(`✓ Seeded ${suppliers.length} suppliers`);

  // Phase 9: 20 to 30 products
  const products = await seedProducts(prisma, suppliers);
  console.log(`✓ Seeded ${products.length} products`);

  // Phase 9: 90 days of synthetic past-dated sales & stock movements
  await seedSalesAndMovements(prisma, products, users);
  console.log("✓ Seeded 90 days of synthetic sales and balanced movements");

  console.log("Modular database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
