import { Module } from "@nestjs/common";
import { PurchaseOrdersModule } from "../purchase-orders/purchase-orders.module.js";
import { ForecastService } from "./forecast.service.js";
import { ForecastController } from "./forecast.controller.js";
import { ReorderFacade } from "./reorder.facade.js";
import { NaiveStrategy } from "./strategies/naive.strategy.js";
import { MovingAverageStrategy } from "./strategies/moving-average.strategy.js";
import { LinearRegressionStrategy } from "./strategies/linear-regression.strategy.js";

// Configures dependency injection and providers for time-series forecasting and reorder calculations.
@Module({
  imports: [PurchaseOrdersModule],
  controllers: [ForecastController],
  providers: [
    ForecastService,
    ReorderFacade,
    NaiveStrategy,
    MovingAverageStrategy,
    LinearRegressionStrategy,
  ],
  exports: [
    ForecastService,
    ReorderFacade,
    NaiveStrategy,
    MovingAverageStrategy,
    LinearRegressionStrategy,
  ],
})
export class ForecastModule {}
