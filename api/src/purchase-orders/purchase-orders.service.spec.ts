import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { MovementType, POStatus, Prisma } from "@prisma/client";
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StockService } from "../stock/stock.service.js";
import { POStateMachine } from "./state-machine/po-state-machine.js";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";

describe("PurchaseOrdersService & POStateMachine", () => {
  let service: PurchaseOrdersService;
  let mockPrisma: any;
  let mockStockService: any;

  const mockSupplier = {
    id: "supp-1",
    name: "Apex Farms",
    isActive: true,
  };

  const mockProductA = {
    id: "prod-A",
    name: "Whole Milk 1L",
    sku: "MLK-01",
    supplierId: "supp-1",
    quantity: 20,
    isActive: true,
  };

  const mockProductB = {
    id: "prod-B",
    name: "Cheddar Cheese 200g",
    sku: "CHS-01",
    supplierId: "supp-2", // Different supplier!
    quantity: 10,
    isActive: true,
  };

  beforeEach(async () => {
    mockPrisma = {
      supplier: {
        findUnique: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      purchaseOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
    };

    mockStockService = {
      recordMovement: jest.fn(),
      emitStockChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POStateMachine transition validation", () => {
    it("should allow valid transitions: DRAFT -> ORDERED and ORDERED -> RECEIVED", () => {
      expect(POStateMachine.canTransition(POStatus.DRAFT, POStatus.ORDERED)).toBe(true);
      expect(POStateMachine.canTransition(POStatus.ORDERED, POStatus.RECEIVED)).toBe(true);
    });

    it("should allow cancellation from DRAFT and ORDERED", () => {
      expect(POStateMachine.canTransition(POStatus.DRAFT, POStatus.CANCELLED)).toBe(true);
      expect(POStateMachine.canTransition(POStatus.ORDERED, POStatus.CANCELLED)).toBe(true);
    });

    it("should reject illegal transition: DRAFT -> RECEIVED with BadRequestException", () => {
      expect(POStateMachine.canTransition(POStatus.DRAFT, POStatus.RECEIVED)).toBe(false);
      expect(() =>
        POStateMachine.assertValidTransition(POStatus.DRAFT, POStatus.RECEIVED),
      ).toThrow(BadRequestException);
    });

    it("should reject transitions from terminal states (RECEIVED, CANCELLED)", () => {
      expect(POStateMachine.canTransition(POStatus.RECEIVED, POStatus.CANCELLED)).toBe(false);
      expect(POStateMachine.canTransition(POStatus.CANCELLED, POStatus.ORDERED)).toBe(false);
      expect(() =>
        POStateMachine.assertValidTransition(POStatus.RECEIVED, POStatus.CANCELLED),
      ).toThrow(BadRequestException);
    });
  });

  describe("createDraft", () => {
    it("should reject PO creation when a product belongs to a different supplier", async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      // Returns product with supplierId "supp-2", but PO is for "supp-1"
      mockPrisma.product.findMany.mockResolvedValue([mockProductB]);

      const dto: CreatePurchaseOrderDto = {
        supplierId: "supp-1",
        items: [{ productId: "prod-B", quantity: 10, unitCost: 4.5 }],
      };

      await expect(service.createDraft(dto, "user-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it("should reject duplicate products in line items", async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);

      const dto: CreatePurchaseOrderDto = {
        supplierId: "supp-1",
        items: [
          { productId: "prod-A", quantity: 10, unitCost: 3.0 },
          { productId: "prod-A", quantity: 15, unitCost: 3.0 },
        ],
      };

      await expect(service.createDraft(dto, "user-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it("should successfully create draft PO when supplier and items are valid", async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.product.findMany.mockResolvedValue([mockProductA]);
      mockPrisma.purchaseOrder.create.mockResolvedValue({
        id: "po-1",
        supplierId: "supp-1",
        status: POStatus.DRAFT,
        items: [{ productId: "prod-A", quantity: 20, unitCost: 3.2 }],
      });

      const dto: CreatePurchaseOrderDto = {
        supplierId: "supp-1",
        items: [{ productId: "prod-A", quantity: 20, unitCost: 3.2 }],
      };

      const result = await service.createDraft(dto, "user-1");

      expect(result.status).toBe(POStatus.DRAFT);
      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          supplierId: "supp-1",
          status: POStatus.DRAFT,
          createdById: "user-1",
          items: {
            create: [
              {
                productId: "prod-A",
                quantity: 20,
                unitCost: new Prisma.Decimal(3.2),
              },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("order and receive transitions", () => {
    it("should transition DRAFT to ORDERED and stamp orderedAt", async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: "po-1",
        status: POStatus.DRAFT,
        items: [],
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({
        id: "po-1",
        status: POStatus.ORDERED,
        orderedAt: new Date(),
      });

      const result = await service.order("po-1");

      expect(result.status).toBe(POStatus.ORDERED);
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: "po-1" },
        data: expect.objectContaining({
          status: POStatus.ORDERED,
          orderedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it("should atomically receive items, record STOCK_IN, and emit stock.changed post-commit", async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: "po-1",
        status: POStatus.ORDERED,
        items: [{ productId: "prod-A", quantity: 50 }],
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({
        id: "po-1",
        status: POStatus.RECEIVED,
        receivedAt: new Date(),
      });
      mockStockService.recordMovement.mockResolvedValue({
        newQuantity: 70,
      });

      const result = await service.receive("po-1", "user-1");

      expect(result.status).toBe(POStatus.RECEIVED);
      expect(mockStockService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "prod-A",
          type: MovementType.STOCK_IN,
          quantity: 50,
        }),
        "user-1",
        mockPrisma,
      );
      expect(mockStockService.emitStockChanged).toHaveBeenCalledWith(
        "prod-A",
        70,
        MovementType.STOCK_IN,
      );
    });

    it("should reject receiving when PO is still in DRAFT status", async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: "po-1",
        status: POStatus.DRAFT,
        items: [{ productId: "prod-A", quantity: 50 }],
      });

      await expect(service.receive("po-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStockService.recordMovement).not.toHaveBeenCalled();
      expect(mockStockService.emitStockChanged).not.toHaveBeenCalled();
    });
  });
});
