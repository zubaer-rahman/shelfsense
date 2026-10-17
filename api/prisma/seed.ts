import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { seedUsers } from "./seeds/users.seed.js";
import { seedSuppliers } from "./seeds/suppliers.seed.js";
import { seedProducts } from "./seeds/products.seed.js";
import { seedSalesAndMovements } from "./seeds/sales.seed.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=================================================");
  console.log("       ShelfSense Database Seeding (Phase 9)     ");
  console.log("=================================================\n");

  console.log("1. Resetting previous transactions and movements...");
  await prisma.stockMovement.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  console.log("✓ Existing test data cleaned successfully.");

  // Demo users (one OWNER, one STAFF)
  console.log("\n2. Seeding demo users...");
  const users = await seedUsers(prisma);
  console.log(`✓ Seeded ${users.length} demo users (${users.map((u) => u.email).join(", ")})`);

  // 3 to 4 suppliers
  console.log("\n3. Seeding suppliers...");
  const suppliers = await seedSuppliers(prisma);
  console.log(`✓ Seeded ${suppliers.length} suppliers`);

  // 20 to 30 products
  console.log("\n4. Seeding products with realistic stock and expiry states...");
  const products = await seedProducts(prisma, suppliers);
  console.log(`✓ Seeded ${products.length} products`);

  // 90 days of synthetic past-dated sales & balanced movements
  console.log("\n5. Generating 90 days of synthetic past-dated sales movements...");
  await seedSalesAndMovements(prisma, products, users);
  console.log("✓ Seeded 90 days of synthetic sales and balanced movements");

  // Post-seed ledger verification
  console.log("\n6. Verifying ledger reconciliation (sum of movements == product.quantity)...");
  const reloadedProducts = await prisma.product.findMany();
  let totalMovementsCount = 0;

  for (const product of reloadedProducts) {
    const movementsAgg = await prisma.stockMovement.aggregate({
      where: { productId: product.id },
      _sum: { quantity: true },
      _count: { id: true },
    });

    const sumMovements = movementsAgg._sum.quantity ?? 0;
    const movementCount = movementsAgg._count.id;
    totalMovementsCount += movementCount;

    if (sumMovements !== product.quantity) {
      throw new Error(
        `Ledger reconciliation mismatch for SKU ${product.sku}: ` +
          `product.quantity = ${product.quantity}, sum(movements) = ${sumMovements}`,
      );
    }
  }
  console.log(
    `✓ Verified: All ${reloadedProducts.length} products perfectly match ledger sum across ${totalMovementsCount} movements!`,
  );

  // Summary counts of inventory status
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const lowStockProducts = reloadedProducts.filter(
    (p) => p.quantity <= p.reorderLevel,
  );
  const expiredProducts = reloadedProducts.filter(
    (p) => p.expiryDate !== null && p.expiryDate < now,
  );
  const nearExpiryProducts = reloadedProducts.filter(
    (p) =>
      p.expiryDate !== null &&
      p.expiryDate >= now &&
      p.expiryDate <= in7Days,
  );

  console.log("\n--- Seed Data Summary ---");
  console.log(`• Users: ${users.length} (OWNER & STAFF)`);
  console.log(`• Suppliers: ${suppliers.length}`);
  console.log(`• Products: ${reloadedProducts.length}`);
  console.log(`• Total Movements: ${totalMovementsCount}`);
  console.log(`• Low-stock items: ${lowStockProducts.length}`);
  console.log(`• Near-expiry items: ${nearExpiryProducts.length}`);
  console.log(`• Expired items: ${expiredProducts.length}`);
  console.log("\n=================================================");
  console.log("Phase 9 database seeding completed successfully!");
  console.log("=================================================\n");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
