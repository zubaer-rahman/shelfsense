import { PrismaClient, Supplier } from "@prisma/client";

export async function seedProducts(
  prisma: PrismaClient,
  suppliers: Supplier[],
) {
  if (suppliers.length === 0)
    throw new Error("Suppliers must be seeded before products");

  const [apex, greenValley, primeDairy, metro] = suppliers;
  const now = new Date();
  const addDays = (d: number) => {
    const res = new Date(now);
    res.setDate(res.getDate() + d);
    return res;
  };

  const sampleProducts = [
    // Apex
    {
      name: "Organic Almond Milk 1L",
      sku: "APX-ALM-01",
      category: "Beverages",
      unitPrice: 3.99,
      quantity: 45,
      reorderLevel: 20,
      expiryDate: addDays(45),
      supplierId: apex.id,
    },
    {
      name: "Cold Brew Coffee 330ml",
      sku: "APX-COF-02",
      category: "Beverages",
      unitPrice: 2.75,
      quantity: 60,
      reorderLevel: 25,
      expiryDate: addDays(30),
      supplierId: apex.id,
    },
    {
      name: "Sparkling Mineral Water 500ml",
      sku: "APX-WAT-03",
      category: "Beverages",
      unitPrice: 1.5,
      quantity: 120,
      reorderLevel: 40,
      expiryDate: addDays(180),
      supplierId: apex.id,
    },
    {
      name: "Pure Orange Juice 1L",
      sku: "APX-OJ-04",
      category: "Beverages",
      unitPrice: 3.2,
      quantity: 8,
      reorderLevel: 15,
      expiryDate: addDays(4),
      supplierId: apex.id,
    }, // Near expiry & low stock

    // GreenValley
    {
      name: "Rolled Oats 1kg",
      sku: "GV-OAT-01",
      category: "Pantry",
      unitPrice: 4.5,
      quantity: 80,
      reorderLevel: 30,
      expiryDate: addDays(200),
      supplierId: greenValley.id,
    },
    {
      name: "Whole Grain Bread 500g",
      sku: "GV-BRD-02",
      category: "Bakery",
      unitPrice: 2.9,
      quantity: 5,
      reorderLevel: 15,
      expiryDate: addDays(-2),
      supplierId: greenValley.id,
    }, // Expired
    {
      name: "Extra Virgin Olive Oil 750ml",
      sku: "GV-OIL-03",
      category: "Pantry",
      unitPrice: 12.0,
      quantity: 35,
      reorderLevel: 10,
      expiryDate: addDays(365),
      supplierId: greenValley.id,
    },
    {
      name: "Organic Honey 500g",
      sku: "GV-HNY-04",
      category: "Pantry",
      unitPrice: 8.5,
      quantity: 25,
      reorderLevel: 12,
      expiryDate: addDays(400),
      supplierId: greenValley.id,
    },

    // Prime Dairy
    {
      name: "Greek Yogurt 500g",
      sku: "PD-YOG-01",
      category: "Dairy",
      unitPrice: 3.4,
      quantity: 18,
      reorderLevel: 20,
      expiryDate: addDays(5),
      supplierId: primeDairy.id,
    }, // Near expiry
    {
      name: "Aged Cheddar Cheese 250g",
      sku: "PD-CHD-02",
      category: "Dairy",
      unitPrice: 5.1,
      quantity: 40,
      reorderLevel: 15,
      expiryDate: addDays(60),
      supplierId: primeDairy.id,
    },
    {
      name: "Salted Butter 250g",
      sku: "PD-BTR-03",
      category: "Dairy",
      unitPrice: 3.8,
      quantity: 50,
      reorderLevel: 20,
      expiryDate: addDays(45),
      supplierId: primeDairy.id,
    },
    {
      name: "Fresh Whole Milk 2L",
      sku: "PD-MLK-04",
      category: "Dairy",
      unitPrice: 2.6,
      quantity: 12,
      reorderLevel: 25,
      expiryDate: addDays(3),
      supplierId: primeDairy.id,
    }, // Low stock & near expiry

    // Metro Household
    {
      name: "Eco Dish Soap 500ml",
      sku: "MH-DSH-01",
      category: "Household",
      unitPrice: 3.1,
      quantity: 55,
      reorderLevel: 20,
      expiryDate: null,
      supplierId: metro.id,
    },
    {
      name: "Paper Towels 2-Pack",
      sku: "MH-PPR-02",
      category: "Household",
      unitPrice: 2.5,
      quantity: 70,
      reorderLevel: 25,
      expiryDate: null,
      supplierId: metro.id,
    },
    {
      name: "Recycled Trash Bags 30L",
      sku: "MH-BAG-03",
      category: "Household",
      unitPrice: 4.2,
      quantity: 40,
      reorderLevel: 15,
      expiryDate: null,
      supplierId: metro.id,
    },
  ];

  const products = [];
  for (const p of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products.push(product);
  }

  return products;
}
