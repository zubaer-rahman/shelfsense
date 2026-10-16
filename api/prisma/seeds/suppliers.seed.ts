import { PrismaClient } from "@prisma/client";

export async function seedSuppliers(prisma: PrismaClient) {
  const suppliersData = [
    {
      name: "Apex Foods & Beverages",
      email: "sales@apexfoods.com",
      phone: "+1-555-0101",
    },
    {
      name: "GreenValley Organics",
      email: "orders@greenvalley.com",
      phone: "+1-555-0102",
    },
    {
      name: "Prime Dairy Distributing",
      email: "info@primedairy.com",
      phone: "+1-555-0103",
    },
    {
      name: "Metro Household Supplies",
      email: "contact@metrohousehold.com",
      phone: "+1-555-0104",
    },
  ];

  const createdSuppliers = [];
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { name: s.name },
    });
    if (existing) {
      createdSuppliers.push(existing);
    } else {
      const created = await prisma.supplier.create({ data: s });
      createdSuppliers.push(created);
    }
  }

  return createdSuppliers;
}
