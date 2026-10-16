import { PrismaClient, Product, User, MovementType } from "@prisma/client";

export async function seedSalesAndMovements(
  prisma: PrismaClient,
  products: Product[],
  users: User[],
) {
  const staff = users.find((u) => u.role === "STAFF") || users[0];
  const owner = users.find((u) => u.role === "OWNER") || users[0];

  const now = new Date();

  // Create initial stock-in movements to balance initial stock, plus synthetic sales over 90 days
  for (const product of products) {
    // Generate synthetic sales over last 90 days
    let totalSales = 0;
    const movementsData: Array<{
      productId: string;
      userId: string;
      type: MovementType;
      quantity: number;
      note?: string;
      createdAt: Date;
    }> = [];

    // Realistic daily sales pattern with noise
    for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);

      // Random daily sales volume between 0 and 5
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseDemand = isWeekend ? 3 : 2;
      const noise = (Math.sin(dayOffset) + 1) * 1.5;
      const dailyQty = Math.max(0, Math.round(baseDemand + (noise - 1)));

      if (dailyQty > 0) {
        totalSales += dailyQty;
        movementsData.push({
          productId: product.id,
          userId: staff.id,
          type: MovementType.SALE,
          quantity: -dailyQty, // Stored negative per signed quantity rule
          note: `Daily store sales (${dailyQty} units)`,
          createdAt: date,
        });
      }
    }

    // Initial stock in 91 days ago to balance current quantity:
    // Initial Stock = Current Quantity + Total Sales
    const initialStockQty = product.quantity + totalSales;
    const initialDate = new Date(now);
    initialDate.setDate(initialDate.getDate() - 92);

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        userId: owner.id,
        type: MovementType.STOCK_IN,
        quantity: initialStockQty,
        note: "Opening inventory balance",
        createdAt: initialDate,
      },
    });

    // Bulk insert daily sales movements
    if (movementsData.length > 0) {
      await prisma.stockMovement.createMany({
        data: movementsData,
      });
    }
  }
}
