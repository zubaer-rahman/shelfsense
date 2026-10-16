import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { POStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";
import { PurchaseOrderQueryDto } from "./dto/purchase-order-query.dto.js";

// Manages purchase order lifecycles, draft creation, supplier verification, and order transitions.
@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new DRAFT purchase order validating supplier integrity and product relationships.
  async createDraft(dto: CreatePurchaseOrderDto, userId: string) {
    // 1. Verify supplier exists and is active
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
      select: { id: true, name: true, isActive: true },
    });

    if (!supplier || !supplier.isActive) {
      throw new BadRequestException("Supplier does not exist or is inactive");
    }

    // 2. Guard against duplicate products in the same purchase order
    const productIds = dto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException(
        "Duplicate products are not allowed in a single purchase order",
      );
    }

    // 3. Query all referenced products to validate supplier relationship and status
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        supplierId: true,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        "One or more products specified in the order do not exist",
      );
    }

    // 4. Validate each product belongs to this supplier and is currently active
    for (const product of products) {
      if (!product.isActive) {
        throw new BadRequestException(
          `Product "${product.name}" (${product.sku}) is inactive and cannot be ordered`,
        );
      }

      if (product.supplierId !== dto.supplierId) {
        throw new BadRequestException(
          `Product "${product.name}" (${product.sku}) does not belong to supplier "${supplier.name}"`,
        );
      }
    }

    // 5. Create Purchase Order with DRAFT status and line items
    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        createdById: userId,
        status: POStatus.DRAFT,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitCost),
          })),
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                quantity: true,
                reorderLevel: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // Queries purchase orders with optional status and supplier filters and pagination.
  async findAll(query: PurchaseOrderQueryDto) {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  quantity: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Returns single purchase order detail by ID including line items and products.
  async findById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException("Purchase order not found");
    }

    return po;
  }
}
