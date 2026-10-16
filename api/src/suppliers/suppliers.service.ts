import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateSupplierDto } from "./dto/create-supplier.dto.js";
import { UpdateSupplierDto } from "./dto/update-supplier.dto.js";
import { SupplierQueryDto } from "./dto/supplier-query.dto.js";

// Manages supplier partner records, lifecycle status, search queries, and soft deletion.
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
      },
    });
  }

  async findAll(query: SupplierQueryDto) {
    const where: Prisma.SupplierWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { products: true, purchaseOrders: true },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
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
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findById(id);

    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
