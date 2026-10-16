import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MovementType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  DailyDemandPoint,
  ForecastStrategy,
} from "./strategies/forecast-strategy.interface.js";
import { NaiveStrategy } from "./strategies/naive.strategy.js";
import { MovingAverageStrategy } from "./strategies/moving-average.strategy.js";
import { LinearRegressionStrategy } from "./strategies/linear-regression.strategy.js";
import { ForecastQueryDto } from "./dto/forecast-query.dto.js";

// Domain service for building historical sales time-series and computing demand forecasts with safety-stock reorder suggestions.
@Injectable()
export class ForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly naiveStrategy: NaiveStrategy,
    private readonly movingAverageStrategy: MovingAverageStrategy,
    private readonly linearRegressionStrategy: LinearRegressionStrategy,
  ) {}

  // Resolves the requested forecasting strategy instance or defaults to moving average.
  resolveStrategy(strategyName?: string): ForecastStrategy {
    switch (strategyName?.toLowerCase()) {
      case "naive":
      case "naive_baseline":
        return this.naiveStrategy;
      case "linear_regression":
      case "linear":
        return this.linearRegressionStrategy;
      case "moving_average":
      case "ma":
      case undefined:
        return this.movingAverageStrategy;
      default:
        throw new BadRequestException(
          `Unsupported forecast strategy '${strategyName}'. Supported options: naive, moving_average, linear_regression`,
        );
    }
  }

  // Aggregates historical SALE movements into a continuous chronological daily series with zero-filled missing days.
  async getDailySalesSeries(
    productId: string,
    daysCount: number,
    untilDate: Date = new Date(),
  ): Promise<DailyDemandPoint[]> {
    const endTimestamp = untilDate.getTime();
    const startTimestamp = endTimestamp - daysCount * 24 * 60 * 60 * 1000;
    const startDate = new Date(startTimestamp);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        productId,
        type: MovementType.SALE,
        createdAt: {
          gte: startDate,
          lte: untilDate,
        },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const salesByDate = new Map<string, number>();
    for (const m of movements) {
      const dateKey = m.createdAt.toISOString().slice(0, 10);
      const current = salesByDate.get(dateKey) ?? 0;
      // Sale movement quantities are stored signed negative in the ledger; aggregate absolute volume
      salesByDate.set(dateKey, current + Math.abs(m.quantity));
    }

    const series: DailyDemandPoint[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const pointDate = new Date(endTimestamp - i * 24 * 60 * 60 * 1000);
      const dateKey = pointDate.toISOString().slice(0, 10);
      series.push({
        date: dateKey,
        quantity: salesByDate.get(dateKey) ?? 0,
      });
    }

    return series;
  }

  // Calculates expected daily demand and recommended reorder quantity for a given product.
  async getForecast(productId: string, query?: ForecastQueryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const defaultWindow =
      this.configService.get<number>("FORECAST_WINDOW_DAYS") ?? 14;
    const leadTimeDays =
      this.configService.get<number>("LEAD_TIME_DAYS") ?? 7;
    const safetyBuffer =
      this.configService.get<number>("SAFETY_BUFFER") ?? 5;

    const window = query?.window ?? defaultWindow;
    const strategy = this.resolveStrategy(query?.strategy);

    const historyDays = Math.max(window, 30);
    const dailySeries = await this.getDailySalesSeries(productId, historyDays);
    const salesFigures = dailySeries.map((point) => point.quantity);

    const expectedDailyDemand = strategy.calculateExpectedDailyDemand(
      salesFigures,
      window,
    );

    // Reorder recommendation formula: max(0, ceil(expectedDailyDemand * LEAD_TIME_DAYS + SAFETY_BUFFER - currentStock))
    const suggestedReorderQuantity = Math.max(
      0,
      Math.ceil(
        expectedDailyDemand * leadTimeDays + safetyBuffer - product.quantity,
      ),
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        supplier: {
          id: product.supplier.id,
          name: product.supplier.name,
          email: product.supplier.email,
        },
      },
      strategy: strategy.name,
      window,
      expectedDailyDemand: Number(expectedDailyDemand.toFixed(4)),
      currentStock: product.quantity,
      leadTimeDays,
      safetyBuffer,
      suggestedReorderQuantity,
      dailySeries: dailySeries.slice(-window),
    };
  }
}
