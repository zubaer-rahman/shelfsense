import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { UpdateProductDto } from "./dto/update-product.dto.js";
import { ProductQueryDto } from "./dto/product-query.dto.js";

// Manages inventory product catalog records, fuzzy search, categories, and lifecycle states.
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    await this.validateSupplier(dto.supplierId);
    await this.validateSkuUniqueness(dto.sku);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        quantity: dto.quantity ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        supplierId: dto.supplierId,
      },
      include: {
        supplier: true,
      },
    });
  }

  private buildWhereClause(query: ProductQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: "insensitive" };
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async findAll(query: ProductQueryDto) {
    const where = this.buildWhereClause(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
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

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        movements: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.supplierId !== undefined) {
      await this.validateSupplier(dto.supplierId);
    }

    if (dto.sku !== undefined) {
      await this.validateSkuUniqueness(dto.sku, id);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unitPrice !== undefined && { unitPrice: new Prisma.Decimal(dto.unitPrice) }),
        ...(dto.reorderLevel !== undefined && { reorderLevel: dto.reorderLevel }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        supplier: true,
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async validateSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, isActive: true },
    });

    if (!supplier || !supplier.isActive) {
      throw new BadRequestException("Supplier does not exist or is inactive");
    }
  }

  private async validateSkuUniqueness(sku: string, excludeProductId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (existing && existing.id !== excludeProductId) {
      throw new ConflictException(`Product with SKU '${sku}' already exists`);
    }
  }
}
