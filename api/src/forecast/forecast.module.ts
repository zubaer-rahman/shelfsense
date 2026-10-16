import { Module } from "@nestjs/common";
import { ForecastService } from "./forecast.service.js";
import { ForecastController } from "./forecast.controller.js";
import { NaiveStrategy } from "./strategies/naive.strategy.js";
import { MovingAverageStrategy } from "./strategies/moving-average.strategy.js";
import { LinearRegressionStrategy } from "./strategies/linear-regression.strategy.js";

// Configures dependency injection and providers for time-series forecasting and reorder calculations.
@Module({
  controllers: [ForecastController],
  providers: [
    ForecastService,
    NaiveStrategy,
    MovingAverageStrategy,
    LinearRegressionStrategy,
  ],
  exports: [
    ForecastService,
    NaiveStrategy,
    MovingAverageStrategy,
    LinearRegressionStrategy,
  ],
})
export class ForecastModule {}
