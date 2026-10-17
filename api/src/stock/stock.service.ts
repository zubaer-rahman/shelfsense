import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MovementType, Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  AdjustmentDirection,
  CreateStockMovementDto,
} from "./dto/create-stock-movement.dto.js";
import { StockMovementQueryDto } from "./dto/stock-movement-query.dto.js";
import { StockChangedEvent } from "./events/stock-changed.event.js";

// Strategy function defining how sign rule is calculated per movement type.
type MovementSignStrategy = (
  quantity: number,
  direction?: AdjustmentDirection,
) => number;

// Strategy map implementing domain rules for signed quantity representation.
const MOVEMENT_STRATEGIES: Record<MovementType, MovementSignStrategy> = {
  [MovementType.SALE]: (qty) => -Math.abs(qty),
  [MovementType.STOCK_IN]: (qty) => Math.abs(qty),
  [MovementType.ADJUSTMENT]: (qty, direction) => {
    if (direction === AdjustmentDirection.DECREASE) {
      return -Math.abs(qty);
    }
    return Math.abs(qty);
  },
};

// Manages inventory stock levels through transactional guarded updates and movement tracking.
@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Resolves signed integer quantity based on MovementType strategy.
  calculateSignedQuantity(
    type: MovementType,
    quantity: number,
    direction?: AdjustmentDirection,
  ): number {
    const strategy = MOVEMENT_STRATEGIES[type];
    return strategy(quantity, direction);
  }

  // Executes a guarded stock movement inside an interactive transaction.
  // Can be called directly or with an external transaction client (e.g. Purchase Order reception).
  async recordMovement(
    dto: CreateStockMovementDto,
    userId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const execute = async (tx: Prisma.TransactionClient) => {
      // 1. Verify product exists and is active
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, name: true, quantity: true, isActive: true },
      });

      if (!product) {
        throw new NotFoundException("Product not found");
      }

      if (!product.isActive) {
        throw new BadRequestException(
          "Cannot record stock movement for an inactive product",
        );
      }

      // 2. Resolve signed quantity via Strategy map
      const signedQuantity = this.calculateSignedQuantity(
        dto.type,
        dto.quantity,
        dto.direction,
      );

      let newQuantity = product.quantity;

      // 3. Apply atomic inventory adjustment
      if (signedQuantity < 0) {
        const decrementAmount = Math.abs(signedQuantity);

        // Guarded conditional update: only succeeds if current quantity >= decrement amount
        const updateResult = await tx.product.updateMany({
          where: {
            id: dto.productId,
            isActive: true,
            quantity: { gte: decrementAmount },
          },
          data: {
            quantity: { decrement: decrementAmount },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictException(
            `Insufficient stock: requested decrement of ${decrementAmount}, but only ${product.quantity} available`,
          );
        }

        newQuantity = product.quantity - decrementAmount;
      } else {
        // Increment inventory
        const updated = await tx.product.update({
          where: { id: dto.productId },
          data: {
            quantity: { increment: signedQuantity },
          },
          select: { quantity: true },
        });

        newQuantity = updated.quantity;
      }

      // 4. Record stock movement entry with signed quantity
      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          userId,
          type: dto.type,
          quantity: signedQuantity,
          note: dto.note,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        movement,
        newQuantity,
        productId: dto.productId,
        type: dto.type,
      };
    };

    if (txClient) {
      return execute(txClient);
    }

    const result = await this.prisma.$transaction(execute);

    // Emit stock.changed event ONLY after transaction has committed
    this.eventEmitter.emit(
      "stock.changed",
      new StockChangedEvent(result.productId, result.newQuantity, result.type),
    );

    return result;
  }

  // Emits stock.changed event after external atomic transaction commits
  emitStockChanged(productId: string, newQuantity: number, type: MovementType) {
    this.eventEmitter.emit(
      "stock.changed",
      new StockChangedEvent(productId, newQuantity, type),
    );
  }

  // Queries historical stock movement records with optional filters and pagination.
  async findAll(query: StockMovementQueryDto) {
    const where: Prisma.StockMovementWhereInput = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Verifies that product quantity strictly matches the sum of all signed stock movements.
  async reconcileStock(productId?: string) {
    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, sku: true, quantity: true },
      });

      if (!product) {
        throw new NotFoundException("Product not found");
      }

      const aggregate = await this.prisma.stockMovement.aggregate({
        where: { productId },
        _sum: { quantity: true },
        _count: { id: true },
      });

      const ledgerQuantity = aggregate._sum.quantity ?? 0;
      const isBalanced = product.quantity === ledgerQuantity;

      return {
        productId: product.id,
        sku: product.sku,
        cachedQuantity: product.quantity,
        ledgerQuantity,
        movementCount: aggregate._count.id,
        isBalanced,
        discrepancy: product.quantity - ledgerQuantity,
      };
    }

    const products = await this.prisma.product.findMany({
      select: { id: true, name: true, sku: true, quantity: true },
    });

    const results = await Promise.all(
      products.map(async (p) => {
        const aggregate = await this.prisma.stockMovement.aggregate({
          where: { productId: p.id },
          _sum: { quantity: true },
          _count: { id: true },
        });

        const ledgerQuantity = aggregate._sum.quantity ?? 0;
        return {
          productId: p.id,
          sku: p.sku,
          cachedQuantity: p.quantity,
          ledgerQuantity,
          movementCount: aggregate._count.id,
          isBalanced: p.quantity === ledgerQuantity,
          discrepancy: p.quantity - ledgerQuantity,
        };
      }),
    );

    const isAllBalanced = results.every((r) => r.isBalanced);
    return {
      totalProducts: results.length,
      isAllBalanced,
      results,
    };
  }
}
