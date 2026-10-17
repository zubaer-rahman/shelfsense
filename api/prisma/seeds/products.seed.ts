import { PrismaClient, Supplier, Product } from "@prisma/client";

// Seeds 24 representative retail products across 4 suppliers with varying expiry and stock states.
export async function seedProducts(
  prisma: PrismaClient,
  suppliers: Supplier[],
): Promise<Product[]> {
  if (suppliers.length < 4) {
    throw new Error("At least 4 suppliers must be seeded before products");
  }

  const [apex, greenValley, primeDairy, metro] = suppliers;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const addDays = (days: number): Date => {
    const res = new Date(now);
    res.setDate(res.getDate() + days);
    return res;
  };

  const sampleProducts = [
    // --- Apex Foods & Beverages (Beverages) ---
    {
      name: "Organic Almond Milk 1L",
      sku: "APX-ALM-01",
      category: "Beverages",
      unitPrice: 3.99,
      quantity: 45,
      reorderLevel: 20,
      expiryDate: addDays(45),
      supplierId: apex!.id,
    },
    {
      name: "Cold Brew Coffee 330ml",
      sku: "APX-COF-02",
      category: "Beverages",
      unitPrice: 2.75,
      quantity: 60,
      reorderLevel: 25,
      expiryDate: addDays(30),
      supplierId: apex!.id,
    },
    {
      name: "Sparkling Mineral Water 500ml",
      sku: "APX-WAT-03",
      category: "Beverages",
      unitPrice: 1.5,
      quantity: 120,
      reorderLevel: 40,
      expiryDate: addDays(180),
      supplierId: apex!.id,
    },
    {
      name: "Pure Orange Juice 1L",
      sku: "APX-OJ-04",
      category: "Beverages",
      unitPrice: 3.2,
      quantity: 8,
      reorderLevel: 20,
      expiryDate: addDays(4), // Near-expiry & low stock
      supplierId: apex!.id,
    },
    {
      name: "Matcha Green Tea 250ml",
      sku: "APX-TEA-05",
      category: "Beverages",
      unitPrice: 3.5,
      quantity: 50,
      reorderLevel: 15,
      expiryDate: addDays(60),
      supplierId: apex!.id,
    },
    {
      name: "Ginger Kombucha 350ml",
      sku: "APX-KMB-06",
      category: "Beverages",
      unitPrice: 3.8,
      quantity: 12,
      reorderLevel: 20,
      expiryDate: addDays(-3), // Expired & low stock
      supplierId: apex!.id,
    },

    // --- GreenValley Organics (Pantry & Bakery) ---
    {
      name: "Rolled Oats 1kg",
      sku: "GV-OAT-01",
      category: "Pantry",
      unitPrice: 4.5,
      quantity: 80,
      reorderLevel: 30,
      expiryDate: addDays(200),
      supplierId: greenValley!.id,
    },
    {
      name: "Whole Grain Bread 500g",
      sku: "GV-BRD-02",
      category: "Bakery",
      unitPrice: 2.9,
      quantity: 5,
      reorderLevel: 15,
      expiryDate: addDays(-2), // Expired & low stock
      supplierId: greenValley!.id,
    },
    {
      name: "Extra Virgin Olive Oil 750ml",
      sku: "GV-OIL-03",
      category: "Pantry",
      unitPrice: 12.0,
      quantity: 35,
      reorderLevel: 10,
      expiryDate: addDays(365),
      supplierId: greenValley!.id,
    },
    {
      name: "Organic Honey 500g",
      sku: "GV-HNY-04",
      category: "Pantry",
      unitPrice: 8.5,
      quantity: 25,
      reorderLevel: 12,
      expiryDate: addDays(400),
      supplierId: greenValley!.id,
    },
    {
      name: "Organic Quinoa 500g",
      sku: "GV-QNA-05",
      category: "Pantry",
      unitPrice: 5.25,
      quantity: 40,
      reorderLevel: 15,
      expiryDate: addDays(240),
      supplierId: greenValley!.id,
    },
    {
      name: "Black Chia Seeds 300g",
      sku: "GV-CHI-06",
      category: "Pantry",
      unitPrice: 4.8,
      quantity: 9,
      reorderLevel: 20,
      expiryDate: addDays(5), // Near-expiry & low stock
      supplierId: greenValley!.id,
    },

    // --- Prime Dairy Distributing (Dairy) ---
    {
      name: "Greek Yogurt 500g",
      sku: "PD-YOG-01",
      category: "Dairy",
      unitPrice: 3.4,
      quantity: 28,
      reorderLevel: 20,
      expiryDate: addDays(5), // Near-expiry
      supplierId: primeDairy!.id,
    },
    {
      name: "Aged Cheddar Cheese 250g",
      sku: "PD-CHD-02",
      category: "Dairy",
      unitPrice: 5.1,
      quantity: 40,
      reorderLevel: 15,
      expiryDate: addDays(60),
      supplierId: primeDairy!.id,
    },
    {
      name: "Salted Butter 250g",
      sku: "PD-BTR-03",
      category: "Dairy",
      unitPrice: 3.8,
      quantity: 50,
      reorderLevel: 20,
      expiryDate: addDays(45),
      supplierId: primeDairy!.id,
    },
    {
      name: "Fresh Whole Milk 2L",
      sku: "PD-MLK-04",
      category: "Dairy",
      unitPrice: 2.6,
      quantity: 10,
      reorderLevel: 25,
      expiryDate: addDays(3), // Near-expiry & low stock
      supplierId: primeDairy!.id,
    },
    {
      name: "Heavy Whipping Cream 500ml",
      sku: "PD-CRM-05",
      category: "Dairy",
      unitPrice: 4.1,
      quantity: 6,
      reorderLevel: 15,
      expiryDate: addDays(-5), // Expired & low stock
      supplierId: primeDairy!.id,
    },
    {
      name: "Grated Parmesan 150g",
      sku: "PD-PAR-06",
      category: "Dairy",
      unitPrice: 4.9,
      quantity: 35,
      reorderLevel: 15,
      expiryDate: addDays(90),
      supplierId: primeDairy!.id,
    },

    // --- Metro Household Supplies (Household) ---
    {
      name: "Eco Dish Soap 500ml",
      sku: "MH-DSH-01",
      category: "Household",
      unitPrice: 3.1,
      quantity: 55,
      reorderLevel: 20,
      expiryDate: null,
      supplierId: metro!.id,
    },
    {
      name: "Paper Towels 2-Pack",
      sku: "MH-PPR-02",
      category: "Household",
      unitPrice: 2.5,
      quantity: 70,
      reorderLevel: 25,
      expiryDate: null,
      supplierId: metro!.id,
    },
    {
      name: "Recycled Trash Bags 30L",
      sku: "MH-BAG-03",
      category: "Household",
      unitPrice: 4.2,
      quantity: 40,
      reorderLevel: 15,
      expiryDate: null,
      supplierId: metro!.id,
    },
    {
      name: "Natural Cellulose Sponges 3-Pack",
      sku: "MH-SPG-04",
      category: "Household",
      unitPrice: 2.2,
      quantity: 7,
      reorderLevel: 20,
      expiryDate: null, // Low stock
      supplierId: metro!.id,
    },
    {
      name: "Liquid Laundry Detergent 1.5L",
      sku: "MH-DET-05",
      category: "Household",
      unitPrice: 9.5,
      quantity: 30,
      reorderLevel: 15,
      expiryDate: null,
      supplierId: metro!.id,
    },
    {
      name: "Multi-Surface Spray 750ml",
      sku: "MH-CLN-06",
      category: "Household",
      unitPrice: 3.75,
      quantity: 45,
      reorderLevel: 20,
      expiryDate: null,
      supplierId: metro!.id,
    },
  ];

  const products: Product[] = [];
  for (const p of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
        quantity: p.quantity,
        reorderLevel: p.reorderLevel,
        expiryDate: p.expiryDate,
        isActive: true,
        supplierId: p.supplierId,
      },
      create: p,
    });
    products.push(product);
  }

  return products;
}
