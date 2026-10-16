import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MovementType } from "@prisma/client";
import { StockService } from "./stock.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  AdjustmentDirection,
  CreateStockMovementDto,
} from "./dto/create-stock-movement.dto.js";

describe("StockService", () => {
  let service: StockService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  const mockProduct = {
    id: "prod-123",
    name: "Whole Milk 1L",
    sku: "MLK-01",
    quantity: 50,
    isActive: true,
  };

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockPrisma = {
      product: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Strategy signed quantity mapping", () => {
    it("should calculate negative quantity for SALE", () => {
      const signed = service.calculateSignedQuantity(MovementType.SALE, 10);
      expect(signed).toBe(-10);
    });

    it("should calculate positive quantity for STOCK_IN", () => {
      const signed = service.calculateSignedQuantity(MovementType.STOCK_IN, 15);
      expect(signed).toBe(15);
    });

    it("should calculate positive quantity for ADJUSTMENT with INCREASE", () => {
      const signed = service.calculateSignedQuantity(
        MovementType.ADJUSTMENT,
        8,
        AdjustmentDirection.INCREASE,
      );
      expect(signed).toBe(8);
    });

    it("should calculate negative quantity for ADJUSTMENT with DECREASE", () => {
      const signed = service.calculateSignedQuantity(
        MovementType.ADJUSTMENT,
        8,
        AdjustmentDirection.DECREASE,
      );
      expect(signed).toBe(-8);
    });
  });

  describe("recordMovement", () => {
    it("should reduce stock on sale and store negative signed quantity", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, quantity: 50 });
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({
        id: "mov-1",
        productId: mockProduct.id,
        quantity: -10,
        type: MovementType.SALE,
      });

      const dto: CreateStockMovementDto = {
        productId: mockProduct.id,
        type: MovementType.SALE,
        quantity: 10,
        note: "Store counter sale",
      };

      const result = await service.recordMovement(dto, "user-1");

      expect(result.newQuantity).toBe(40);
      expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockProduct.id,
          isActive: true,
          quantity: { gte: 10 },
        },
        data: {
          quantity: { decrement: 10 },
        },
      });
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: mockProduct.id,
          quantity: -10,
          type: MovementType.SALE,
        }),
        include: expect.any(Object),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "stock.changed",
        expect.objectContaining({
          productId: mockProduct.id,
          newQuantity: 40,
          type: MovementType.SALE,
        }),
      );
    });

    it("should reject sale above current stock with ConflictException", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, quantity: 5 });
      mockPrisma.product.updateMany.mockResolvedValue({ count: 0 }); // Guarded decrement failed

      const dto: CreateStockMovementDto = {
        productId: mockProduct.id,
        type: MovementType.SALE,
        quantity: 20,
      };

      await expect(service.recordMovement(dto, "user-1")).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should increase stock on STOCK_IN and store positive signed quantity", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, quantity: 50 });
      mockPrisma.product.update.mockResolvedValue({ quantity: 75 });
      mockPrisma.stockMovement.create.mockResolvedValue({
        id: "mov-2",
        productId: mockProduct.id,
        quantity: 25,
        type: MovementType.STOCK_IN,
      });

      const dto: CreateStockMovementDto = {
        productId: mockProduct.id,
        type: MovementType.STOCK_IN,
        quantity: 25,
        note: "Delivery batch",
      };

      const result = await service.recordMovement(dto, "user-1");

      expect(result.newQuantity).toBe(75);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: {
          quantity: { increment: 25 },
        },
        select: { quantity: true },
      });
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: mockProduct.id,
          quantity: 25,
          type: MovementType.STOCK_IN,
        }),
        include: expect.any(Object),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "stock.changed",
        expect.objectContaining({
          productId: mockProduct.id,
          newQuantity: 75,
          type: MovementType.STOCK_IN,
        }),
      );
    });

    it("should adjust stock with direction properly", async () => {
      // Test decrease adjustment
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, quantity: 50 });
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({
        id: "mov-3",
        productId: mockProduct.id,
        quantity: -7,
        type: MovementType.ADJUSTMENT,
      });

      const dto: CreateStockMovementDto = {
        productId: mockProduct.id,
        type: MovementType.ADJUSTMENT,
        direction: AdjustmentDirection.DECREASE,
        quantity: 7,
        note: "Broken items",
      };

      const result = await service.recordMovement(dto, "user-1");

      expect(result.newQuantity).toBe(43);
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: -7,
          type: MovementType.ADJUSTMENT,
        }),
        include: expect.any(Object),
      });
    });

    it("should reject movement on inactive product with BadRequestException", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      const dto: CreateStockMovementDto = {
        productId: mockProduct.id,
        type: MovementType.SALE,
        quantity: 5,
      };

      await expect(service.recordMovement(dto, "user-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.product.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });
});
