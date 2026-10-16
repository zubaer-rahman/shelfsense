import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MovementType } from "@prisma/client";
import { ForecastService } from "./forecast.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { NaiveStrategy } from "./strategies/naive.strategy.js";
import { MovingAverageStrategy } from "./strategies/moving-average.strategy.js";
import { LinearRegressionStrategy } from "./strategies/linear-regression.strategy.js";

describe("Forecast & Demand Strategies", () => {
  describe("NaiveStrategy", () => {
    const strategy = new NaiveStrategy();

    it("returns 0 for empty series", () => {
      expect(strategy.calculateExpectedDailyDemand([])).toBe(0);
    });

    it("projects the most recent day's demand forward", () => {
      expect(strategy.calculateExpectedDailyDemand([3, 7, 12])).toBe(12);
    });

    it("clamps negative values to 0", () => {
      expect(strategy.calculateExpectedDailyDemand([-5])).toBe(0);
    });
  });

  describe("MovingAverageStrategy", () => {
    const strategy = new MovingAverageStrategy();

    it("returns 0 for empty series", () => {
      expect(strategy.calculateExpectedDailyDemand([])).toBe(0);
    });

    it("computes arithmetic mean over full series when window is not specified", () => {
      // (2 + 4 + 6) / 3 = 4
      expect(strategy.calculateExpectedDailyDemand([2, 4, 6])).toBe(4);
    });

    it("computes arithmetic mean over the requested window slice", () => {
      // Series length 4, window 2 => evaluates last 2 elements: [30, 40] => 35
      expect(strategy.calculateExpectedDailyDemand([10, 20, 30, 40], 2)).toBe(35);
    });

    it("handles window larger than series length gracefully", () => {
      expect(strategy.calculateExpectedDailyDemand([10, 20], 14)).toBe(15);
    });
  });

  describe("LinearRegressionStrategy", () => {
    const strategy = new LinearRegressionStrategy();

    it("returns 0 for empty series and single value for length 1", () => {
      expect(strategy.calculateExpectedDailyDemand([])).toBe(0);
      expect(strategy.calculateExpectedDailyDemand([9])).toBe(9);
    });

    it("projects constant series with zero slope", () => {
      expect(strategy.calculateExpectedDailyDemand([5, 5, 5])).toBe(5);
    });

    it("projects upward trend accurately based on least-squares fit", () => {
      // Days x: [0, 1, 2], Demand y: [2, 4, 6]
      // slope m = 2, intercept b = 2 => at next step x = 3: y = 2(3) + 2 = 8
      expect(strategy.calculateExpectedDailyDemand([2, 4, 6])).toBe(8);
    });

    it("evaluates trend only within specified window", () => {
      // Series [999, 2, 4, 6] with window 3 evaluates [2, 4, 6] => 8
      expect(strategy.calculateExpectedDailyDemand([999, 2, 4, 6], 3)).toBe(8);
    });

    it("clamps steep downward trend to 0 (non-negative demand invariant)", () => {
      // Days x: [0, 1, 2], Demand y: [10, 6, 2]
      // slope m = -4, intercept b = 10 => at x = 3: y = -4(3) + 10 = -2 => clamped to 0
      expect(strategy.calculateExpectedDailyDemand([10, 6, 2])).toBe(0);
    });
  });

  describe("ForecastService", () => {
    let service: ForecastService;
    let mockPrisma: any;
    let mockConfigService: any;

    const mockProduct = {
      id: "prod-abc",
      name: "Organic Oats 1kg",
      sku: "OAT-01",
      category: "Grains",
      unitPrice: 4.5,
      quantity: 10,
      reorderLevel: 15,
      supplier: {
        id: "sup-1",
        name: "Grain Supplies Ltd",
        email: "orders@grainsupplies.local",
      },
    };

    beforeEach(async () => {
      mockPrisma = {
        product: {
          findUnique: jest.fn(),
        },
        stockMovement: {
          findMany: jest.fn(),
        },
      };

      mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case "FORECAST_WINDOW_DAYS":
              return 14;
            case "LEAD_TIME_DAYS":
              return 7;
            case "SAFETY_BUFFER":
              return 5;
            default:
              return null;
          }
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ForecastService,
          NaiveStrategy,
          MovingAverageStrategy,
          LinearRegressionStrategy,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<ForecastService>(ForecastService);
    });

    describe("resolveStrategy", () => {
      it("resolves naive strategy by alias", () => {
        const strategy = service.resolveStrategy("naive");
        expect(strategy.name).toBe("naive");
      });

      it("resolves linear regression strategy by alias", () => {
        const strategy = service.resolveStrategy("linear_regression");
        expect(strategy.name).toBe("linear_regression");
      });

      it("defaults to moving average when strategy is omitted", () => {
        const strategy = service.resolveStrategy();
        expect(strategy.name).toBe("moving_average");
      });

      it("throws BadRequestException for unsupported strategy names", () => {
        expect(() => service.resolveStrategy("quantum_arima")).toThrow(
          BadRequestException,
        );
      });
    });

    describe("getDailySalesSeries", () => {
      it("aggregates multiple sales on the same date and zero-fills missing days", async () => {
        const now = new Date("2026-10-15T12:00:00.000Z");

        // Two movements on 2026-10-15 (-3 and -5), one on 2026-10-13 (-2)
        mockPrisma.stockMovement.findMany.mockResolvedValue([
          {
            quantity: -2,
            createdAt: new Date("2026-10-13T09:00:00.000Z"),
          },
          {
            quantity: -3,
            createdAt: new Date("2026-10-15T10:00:00.000Z"),
          },
          {
            quantity: -5,
            createdAt: new Date("2026-10-15T16:00:00.000Z"),
          },
        ]);

        const series = await service.getDailySalesSeries("prod-abc", 4, now);

        expect(series).toHaveLength(4);
        // Dates should be continuous: Oct 12, Oct 13, Oct 14, Oct 15
        const seriesMap = new Map(series.map((p) => [p.date, p.quantity]));

        expect(seriesMap.get("2026-10-12")).toBe(0); // Zero-filled
        expect(seriesMap.get("2026-10-13")).toBe(2); // Aggregated absolute value
        expect(seriesMap.get("2026-10-14")).toBe(0); // Zero-filled
        expect(seriesMap.get("2026-10-15")).toBe(8); // Aggregated 3 + 5
      });
    });

    describe("getForecast", () => {
      it("throws NotFoundException if product is not found", async () => {
        mockPrisma.product.findUnique.mockResolvedValue(null);

        await expect(service.getForecast("non-existent")).rejects.toThrow(
          NotFoundException,
        );
      });

      it("calculates expected daily demand and reorder suggestion using config formula", async () => {
        mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

        // Constant sales of 2 units/day
        mockPrisma.stockMovement.findMany.mockResolvedValue(
          Array.from({ length: 14 }, (_, i) => {
            const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
            return {
              quantity: -2,
              createdAt: d,
            };
          }),
        );

        const result = await service.getForecast("prod-abc", {
          strategy: "moving_average",
          window: 14,
        });

        expect(result.strategy).toBe("moving_average");
        expect(result.expectedDailyDemand).toBe(2);
        expect(result.leadTimeDays).toBe(7);
        expect(result.safetyBuffer).toBe(5);
        expect(result.currentStock).toBe(10);

        // Formula: max(0, ceil(demand * leadTime + safetyBuffer - currentStock))
        // ceil(2 * 7 + 5 - 10) = ceil(14 + 5 - 10) = ceil(9) = 9
        expect(result.suggestedReorderQuantity).toBe(9);
      });

      it("clamps suggested reorder quantity to 0 when stock is abundant", async () => {
        // High stock product
        mockPrisma.product.findUnique.mockResolvedValue({
          ...mockProduct,
          quantity: 100,
        });

        // 1 unit/day
        mockPrisma.stockMovement.findMany.mockResolvedValue([
          { quantity: -1, createdAt: new Date() },
        ]);

        const result = await service.getForecast("prod-abc");

        // ceil(1 * 7 + 5 - 100) = -88 => clamped to 0
        expect(result.suggestedReorderQuantity).toBe(0);
      });
    });
  });
});
