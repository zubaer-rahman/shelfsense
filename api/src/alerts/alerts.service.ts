import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service.js";
import { PaginationDto } from "../common/dto/pagination.dto.js";
import { NearExpiryQueryDto } from "./dto/near-expiry-query.dto.js";

// Manages real-time inventory alerts, threshold checks, and expiration warnings.
@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // Verifies whether a product has breached its low-stock reorder threshold.
  isLowStock(quantity: number, reorderLevel: number): boolean {
    return quantity <= reorderLevel;
  }

  // Returns active products where quantity is at or below the reorderLevel threshold.
  async getLowStockAlerts(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const allActive = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { quantity: "asc" },
    });

    const lowStockProducts = allActive
      .filter((product) => product.quantity <= product.reorderLevel)
      .map((product) => ({
        ...product,
        deficit: Math.max(0, product.reorderLevel - product.quantity),
      }));

    const total = lowStockProducts.length;
    const skip = query.skip;
    const items = lowStockProducts.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Returns active products with an expiryDate within the next N days and not yet expired.
  async getNearExpiryAlerts(query: NearExpiryQueryDto) {
    const days =
      query.days ?? this.configService.get<number>("NEAR_EXPIRY_DAYS", 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(23, 59, 59, 999);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const where = {
      isActive: true,
      expiryDate: {
        gte: today,
        lte: targetDate,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: "asc" },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      days,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Returns active products with an expiryDate earlier than today.
  async getExpiredAlerts(query: PaginationDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const where = {
      isActive: true,
      expiryDate: {
        lt: today,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: "desc" },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
