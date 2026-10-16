import { Injectable } from "@nestjs/common";
import { ForecastStrategy } from "./forecast-strategy.interface.js";

// Naive demand forecasting strategy projecting the most recent observed day's demand forward.
@Injectable()
export class NaiveStrategy implements ForecastStrategy {
  readonly name = "naive";

  calculateExpectedDailyDemand(series: number[]): number {
    if (!series || series.length === 0) {
      return 0;
    }

    const mostRecent = series[series.length - 1];
    return Math.max(0, mostRecent ?? 0);
  }
}
