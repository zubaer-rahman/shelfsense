import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MovementType } from "@prisma/client";
import { StockService } from "./stock.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AdjustmentDirection } from "./dto/create-stock-movement.dto.js";

// Unit tests validating that product quantity strictly equals the sum of historical stock movements.
describe("Stock Ledger Reconciliation", () => {
  let service: StockService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockPrisma = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
        aggregate: jest.fn(),
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

  describe("reconcileStock single product", () => {
    it("should report balanced status when cached quantity matches movement sum", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: "prod-1",
        name: "Whole Milk 1L",
        sku: "MLK-01",
        quantity: 45,
      });

      mockPrisma.stockMovement.aggregate.mockResolvedValue({
        _sum: { quantity: 45 },
        _count: { id: 18 },
      });

      const report = await service.reconcileStock("prod-1");

      expect(report.isBalanced).toBe(true);
      expect(report.cachedQuantity).toBe(45);
      expect(report.ledgerQuantity).toBe(45);
      expect(report.discrepancy).toBe(0);
      expect(report.movementCount).toBe(18);
    });

    it("should detect discrepancy when cached quantity differs from movement sum", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: "prod-2",
        name: "Greek Yogurt 500g",
        sku: "YOG-02",
        quantity: 50,
      });

      mockPrisma.stockMovement.aggregate.mockResolvedValue({
        _sum: { quantity: 42 }, // Drifted by 8 units
        _count: { id: 10 },
      });

      const report = await service.reconcileStock("prod-2");

      expect(report.isBalanced).toBe(false);
      expect(report.cachedQuantity).toBe(50);
      expect(report.ledgerQuantity).toBe(42);
      expect(report.discrepancy).toBe(8);
    });

    it("should throw NotFoundException if product is not found", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.reconcileStock("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("reconcileStock multiple products", () => {
    it("should audit all products and report global balanced state", async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: "p1", name: "Almond Milk", sku: "ALM-01", quantity: 30 },
        { id: "p2", name: "Cold Brew", sku: "COF-02", quantity: 15 },
      ]);

      mockPrisma.stockMovement.aggregate
        .mockResolvedValueOnce({
          _sum: { quantity: 30 },
          _count: { id: 12 },
        })
        .mockResolvedValueOnce({
          _sum: { quantity: 15 },
          _count: { id: 7 },
        });

      const report = await service.reconcileStock();

      expect(report.totalProducts).toBe(2);
      expect(report.isAllBalanced).toBe(true);
      expect(report.results).toHaveLength(2);
      expect(report.results[0]!.isBalanced).toBe(true);
      expect(report.results[1]!.isBalanced).toBe(true);
    });
  });

  describe("Sequential movement simulation maintaining ledger invariant", () => {
    it("should maintain ledger sum == cached balance across opening, sales, adjustments, and rejections", async () => {
      // In-memory state simulation
      let inMemoryCachedQty = 0;
      const inMemoryMovements: Array<{ type: MovementType; quantity: number }> = [];

      // Wire mockPrisma to update state faithfully
      mockPrisma.product.findUnique.mockImplementation(async () => ({
        id: "prod-sim",
        name: "Test Product",
        sku: "TST-01",
        quantity: inMemoryCachedQty,
        isActive: true,
      }));

      mockPrisma.product.updateMany.mockImplementation(async (params: any) => {
        const decrement = params.data.quantity.decrement;
        if (inMemoryCachedQty >= decrement) {
          inMemoryCachedQty -= decrement;
          return { count: 1 };
        }
        return { count: 0 };
      });

      mockPrisma.product.update.mockImplementation(async (params: any) => {
        const increment = params.data.quantity.increment;
        inMemoryCachedQty += increment;
        return { quantity: inMemoryCachedQty };
      });

      mockPrisma.stockMovement.create.mockImplementation(async (params: any) => {
        inMemoryMovements.push({
          type: params.data.type,
          quantity: params.data.quantity,
        });
        return { id: "m-" + inMemoryMovements.length, ...params.data };
      });

      const getLedgerSum = () =>
        inMemoryMovements.reduce((sum, m) => sum + m.quantity, 0);

      // Step 1: Initial stock in (+100)
      const res1 = await service.recordMovement(
        {
          productId: "prod-sim",
          type: MovementType.STOCK_IN,
          quantity: 100,
          note: "Opening stock",
        },
        "owner-1",
      );
      expect(res1.newQuantity).toBe(100);
      expect(inMemoryCachedQty).toBe(100);
      expect(getLedgerSum()).toBe(100);
      expect(inMemoryCachedQty).toBe(getLedgerSum());

      // Step 2: Sale of 25 units (-25)
      const res2 = await service.recordMovement(
        {
          productId: "prod-sim",
          type: MovementType.SALE,
          quantity: 25,
          note: "Retail sale",
        },
        "staff-1",
      );
      expect(res2.newQuantity).toBe(75);
      expect(inMemoryCachedQty).toBe(75);
      expect(getLedgerSum()).toBe(75);
      expect(inMemoryCachedQty).toBe(getLedgerSum());

      // Step 3: Sale of 30 units (-30)
      const res3 = await service.recordMovement(
        {
          productId: "prod-sim",
          type: MovementType.SALE,
          quantity: 30,
          note: "Bulk customer sale",
        },
        "staff-1",
      );
      expect(res3.newQuantity).toBe(45);
      expect(inMemoryCachedQty).toBe(45);
      expect(getLedgerSum()).toBe(45);
      expect(inMemoryCachedQty).toBe(getLedgerSum());

      // Step 4: Physical count audit adjustment INCREASE (+10)
      const res4 = await service.recordMovement(
        {
          productId: "prod-sim",
          type: MovementType.ADJUSTMENT,
          direction: AdjustmentDirection.INCREASE,
          quantity: 10,
          note: "Inventory found during audit",
        },
        "owner-1",
      );
      expect(res4.newQuantity).toBe(55);
      expect(inMemoryCachedQty).toBe(55);
      expect(getLedgerSum()).toBe(55);
      expect(inMemoryCachedQty).toBe(getLedgerSum());

      // Step 5: Damaged goods adjustment DECREASE (-5)
      const res5 = await service.recordMovement(
        {
          productId: "prod-sim",
          type: MovementType.ADJUSTMENT,
          direction: AdjustmentDirection.DECREASE,
          quantity: 5,
          note: "Damaged box writeoff",
        },
        "owner-1",
      );
      expect(res5.newQuantity).toBe(50);
      expect(inMemoryCachedQty).toBe(50);
      expect(getLedgerSum()).toBe(50);
      expect(inMemoryCachedQty).toBe(getLedgerSum());

      // Step 6: Attempting sale above current stock (attempting 80 when balance is 50)
      await expect(
        service.recordMovement(
          {
            productId: "prod-sim",
            type: MovementType.SALE,
            quantity: 80,
          },
          "staff-1",
        ),
      ).rejects.toThrow(ConflictException);

      // Verify that failure did not mutate balance or record an orphaned movement
      expect(inMemoryCachedQty).toBe(50);
      expect(getLedgerSum()).toBe(50);
      expect(inMemoryCachedQty).toBe(getLedgerSum());
      expect(inMemoryMovements).toHaveLength(5);
    });
  });
});
