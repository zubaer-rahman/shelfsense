import { Injectable } from "@nestjs/common";
import { ForecastStrategy } from "./forecast-strategy.interface.js";

// Moving average demand forecasting strategy projecting the arithmetic mean over a recent observation window.
@Injectable()
export class MovingAverageStrategy implements ForecastStrategy {
  readonly name = "moving_average";

  calculateExpectedDailyDemand(series: number[], window?: number): number {
    if (!series || series.length === 0) {
      return 0;
    }

    const effectiveWindow =
      window && window > 0 ? Math.min(window, series.length) : series.length;
    const windowSlice = series.slice(-effectiveWindow);

    if (windowSlice.length === 0) {
      return 0;
    }

    const sum = windowSlice.reduce((acc, val) => acc + val, 0);
    const average = sum / windowSlice.length;

    return Math.max(0, average);
  }
}
