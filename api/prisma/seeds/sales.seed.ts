import { PrismaClient, Product, User, MovementType } from "@prisma/client";

interface DemandProfile {
  baseDemand: number;
  trendSlope: number; // Daily growth/decline rate
  weekendBump: number;
  noiseAmplitude: number;
}

// Maps products to varied synthetic demand profiles (trends, seasonal bumps, stable means with noise)
function getDemandProfile(index: number, sku: string): DemandProfile {
  // 1. Growing Trend Products (Linear regression performs best)
  if (["APX-ALM-01", "APX-TEA-05", "GV-QNA-05", "PD-CHD-02"].includes(sku)) {
    return {
      baseDemand: 5 + (index % 3),
      trendSlope: 0.12, // Increases by ~11 units across 90 days
      weekendBump: 2,
      noiseAmplitude: 2.0,
    };
  }

  // 2. Declining Trend Products (Linear regression captures drop)
  if (["APX-COF-02", "GV-BRD-02", "PD-CRM-05", "MH-SPG-04"].includes(sku)) {
    return {
      baseDemand: 16 + (index % 3),
      trendSlope: -0.1, // Drops by ~9 units across 90 days
      weekendBump: 1,
      noiseAmplitude: 2.0,
    };
  }

  // 3. High-Volume Steady Demand (Moving Average smooths out noise)
  if (["APX-WAT-03", "GV-OAT-01", "PD-BTR-03", "MH-PPR-02"].includes(sku)) {
    return {
      baseDemand: 15 + (index % 4),
      trendSlope: 0.0,
      weekendBump: 4,
      noiseAmplitude: 3.5,
    };
  }

  // 4. Moderate-Volume Grocery Demand
  if (["APX-OJ-04", "GV-OIL-03", "PD-YOG-01", "PD-MLK-04"].includes(sku)) {
    return {
      baseDemand: 9 + (index % 3),
      trendSlope: 0.01,
      weekendBump: 3,
      noiseAmplitude: 2.5,
    };
  }

  // 5. Low-Volume / Sporadic Demand
  return {
    baseDemand: 3 + (index % 3),
    trendSlope: 0.0,
    weekendBump: 1,
    noiseAmplitude: 1.5,
  };
}

// Seeds 90 days of realistic past-dated sales movements matching exact cached product balances.
export async function seedSalesAndMovements(
  prisma: PrismaClient,
  products: Product[],
  users: User[],
) {
  const staff = users.find((u) => u.role === "STAFF") || users[0]!;
  const owner = users.find((u) => u.role === "OWNER") || users[0]!;

  const now = new Date();
  now.setHours(12, 0, 0, 0);

  for (let pIdx = 0; pIdx < products.length; pIdx++) {
    const product = products[pIdx]!;
    const profile = getDemandProfile(pIdx, product.sku);

    let totalSales = 0;
    const salesMovements: Array<{
      productId: string;
      userId: string;
      type: MovementType;
      quantity: number;
      note?: string;
      createdAt: Date;
    }> = [];

    // Generate 90 days of synthetic daily sales
    for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
      const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      date.setHours(
        10 + (dayOffset % 8),
        (dayOffset * 17) % 60,
        (dayOffset * 31) % 60,
        0,
      );

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendBonus = isWeekend ? profile.weekendBump : 0;
      const daysElapsed = 90 - dayOffset;
      const trendEffect = profile.trendSlope * daysElapsed;

      // Deterministic periodic noise using harmonic waves
      const noise =
        Math.sin(dayOffset * 1.5 + pIdx) * profile.noiseAmplitude +
        Math.cos(dayOffset * 0.8) * (profile.noiseAmplitude * 0.5);

      const dailyDemand = Math.max(
        0,
        Math.round(profile.baseDemand + trendEffect + weekendBonus + noise),
      );

      if (dailyDemand > 0) {
        totalSales += dailyDemand;
        salesMovements.push({
          productId: product.id,
          userId: staff.id,
          type: MovementType.SALE,
          quantity: -dailyDemand, // Stored negative per signed quantity rule
          note: `Daily customer retail sales (${dailyDemand} units)`,
          createdAt: date,
        });
      }
    }

    // Optional specific audit adjustments on select products to demonstrate ADJUSTMENT type
    const adjustments: Array<{
      productId: string;
      userId: string;
      type: MovementType;
      quantity: number;
      note?: string;
      createdAt: Date;
    }> = [];

    if (product.sku === "APX-WAT-03") {
      const adjDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      adjDate.setHours(15, 30, 0, 0);
      adjustments.push({
        productId: product.id,
        userId: owner.id,
        type: MovementType.ADJUSTMENT,
        quantity: 5,
        note: "Quarterly physical inventory count audit (+5 units found)",
        createdAt: adjDate,
      });
    } else if (product.sku === "PD-CHD-02") {
      const adjDate = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
      adjDate.setHours(14, 15, 0, 0);
      adjustments.push({
        productId: product.id,
        userId: owner.id,
        type: MovementType.ADJUSTMENT,
        quantity: -2,
        note: "Damaged packaging during shelf restock (-2 units written off)",
        createdAt: adjDate,
      });
    }

    const netAdjustments = adjustments.reduce((sum, a) => sum + a.quantity, 0);

    // Initial stock-in placed 92 days ago before sales start:
    // Final product.quantity = Initial Stock - totalSales + netAdjustments
    // Initial Stock = product.quantity + totalSales - netAdjustments
    const initialStockQty = product.quantity + totalSales - netAdjustments;
    const initialDate = new Date(now.getTime() - 92 * 24 * 60 * 60 * 1000);
    initialDate.setHours(9, 0, 0, 0);

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        userId: owner.id,
        type: MovementType.STOCK_IN,
        quantity: initialStockQty,
        note: "Opening warehouse balance",
        createdAt: initialDate,
      },
    });

    if (adjustments.length > 0) {
      await prisma.stockMovement.createMany({
        data: adjustments,
      });
    }

    // Insert daily sales movements in bulk
    if (salesMovements.length > 0) {
      await prisma.stockMovement.createMany({
        data: salesMovements,
      });
    }
  }
}
