// Daily demand data point used in time-series forecasting.
export interface DailyDemandPoint {
  date: string; // ISO date YYYY-MM-DD
  quantity: number; // Absolute quantity sold on that day (>= 0)
}

// Strategy contract for forecasting expected daily consumer demand from historical sales series.
export interface ForecastStrategy {
  readonly name: string;

  /**
   * Predicts expected daily demand based on a chronological series of daily sales figures.
   * @param series Array of non-negative daily sales figures ordered from oldest to newest.
   * @returns Non-negative expected daily demand rate.
   */
  calculateExpectedDailyDemand(series: number[]): number;
}
