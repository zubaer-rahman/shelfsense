import { Injectable } from "@nestjs/common";
import { ForecastStrategy } from "./forecast-strategy.interface.js";

// Linear regression demand forecasting strategy estimating trend slope and intercept via ordinary least squares.
@Injectable()
export class LinearRegressionStrategy implements ForecastStrategy {
  readonly name = "linear_regression";

  calculateExpectedDailyDemand(series: number[], window?: number): number {
    if (!series || series.length === 0) {
      return 0;
    }

    const effectiveWindow =
      window && window > 0 ? Math.min(window, series.length) : series.length;
    const windowSlice = series.slice(-effectiveWindow);
    const n = windowSlice.length;

    if (n === 0) {
      return 0;
    }

    if (n === 1) {
      return Math.max(0, windowSlice[0] ?? 0);
    }

    // Mean of independent variable x (day index 0 ... n-1)
    const xMean = (n - 1) / 2;

    // Mean of dependent variable y (daily demand)
    const ySum = windowSlice.reduce((acc, val) => acc + val, 0);
    const yMean = ySum / n;

    // Ordinary least squares slope (m) and intercept (b)
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = (windowSlice[i] ?? 0) - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Predict next step at x = n (immediately following the observed window)
    const predicted = slope * n + intercept;

    return Math.max(0, predicted);
  }
}
