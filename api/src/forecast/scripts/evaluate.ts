import "dotenv/config";
import { PrismaClient, MovementType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { NaiveStrategy } from "../strategies/naive.strategy.js";
import { MovingAverageStrategy } from "../strategies/moving-average.strategy.js";
import { LinearRegressionStrategy } from "../strategies/linear-regression.strategy.js";

interface EvaluationResult {
  strategy: string;
  window: number;
  mae: number;
  improvementPercentage: number;
}

// Standalone offline model evaluation script using train/test holdout split and Mean Absolute Error (MAE).
export async function runForecastEvaluation() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const naive = new NaiveStrategy();
  const movingAverage = new MovingAverageStrategy();
  const linearRegression = new LinearRegressionStrategy();

  const HOLDOUT_DAYS = 14;
  const WINDOWS = [7, 14, 30];

  console.log("\n========================================================");
  console.log("       ShelfSense AI/ML Demand Forecast Evaluation       ");
  console.log("========================================================\n");
  console.log(`Holdout horizon: Last ${HOLDOUT_DAYS} days`);
  console.log(`Evaluated windows: ${WINDOWS.join(", ")} days\n`);

  try {
    // 1. Fetch products and check historical sales movements
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    const evaluatedProducts: {
      id: string;
      name: string;
      series: number[];
    }[] = [];

    for (const product of products) {
      const sales = await prisma.stockMovement.findMany({
        where: {
          productId: product.id,
          type: MovementType.SALE,
        },
        orderBy: { createdAt: "asc" },
        select: {
          quantity: true,
          createdAt: true,
        },
      });

      if (sales.length === 0) continue;

      // Group sales by date
      const salesByDate = new Map<string, number>();
      for (const s of sales) {
        const dateKey = s.createdAt.toISOString().slice(0, 10);
        salesByDate.set(
          dateKey,
          (salesByDate.get(dateKey) ?? 0) + Math.abs(s.quantity),
        );
      }

      // Compute contiguous span
      const minDate = new Date(sales[0]!.createdAt);
      minDate.setHours(0, 0, 0, 0);
      const maxDate = new Date(sales[sales.length - 1]!.createdAt);
      maxDate.setHours(0, 0, 0, 0);

      const daySpan =
        Math.round(
          (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      if (daySpan < HOLDOUT_DAYS + 7) {
        // Need at least 7 days train + 14 days holdout
        continue;
      }

      const series: number[] = [];
      for (let i = 0; i < daySpan; i++) {
        const d = new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateKey = d.toISOString().slice(0, 10);
        series.push(salesByDate.get(dateKey) ?? 0);
      }

      evaluatedProducts.push({
        id: product.id,
        name: product.name,
        series,
      });
    }

    // Fallback to representative synthetic series if catalog hasn't been seeded yet
    if (evaluatedProducts.length === 0) {
      console.log(
        "Notice: Insufficient historical sales in database. Generating 20 synthetic products with 90-day seasonal demand series for evaluation...",
      );
      for (let p = 1; p <= 20; p++) {
        const baseDemand = 10 + (p % 5) * 5;
        const trend = 0.05 * (p % 3 === 0 ? -1 : 1);
        const series: number[] = [];
        for (let day = 0; day < 90; day++) {
          const dayOfWeek = day % 7;
          const weekendBump = dayOfWeek === 5 || dayOfWeek === 6 ? 4 : 0;
          const noise = Math.sin(day * 0.7) * 3;
          const value = Math.max(
            0,
            Math.round(baseDemand + trend * day + weekendBump + noise),
          );
          series.push(value);
        }
        evaluatedProducts.push({
          id: `synthetic-${p}`,
          name: `Catalog Product #${p}`,
          series,
        });
      }
    }

    console.log(`Evaluating ${evaluatedProducts.length} product demand series...\n`);

    // 2. Perform rolling holdout evaluation across test window
    // Errors accumulator: key is `${strategy}:${window}`
    const absoluteErrors: Map<string, number[]> = new Map();

    const recordError = (strategy: string, window: number, error: number) => {
      const key = `${strategy}:${window}`;
      if (!absoluteErrors.has(key)) {
        absoluteErrors.set(key, []);
      }
      absoluteErrors.get(key)!.push(error);
    };

    for (const { series } of evaluatedProducts) {
      const totalDays = series.length;
      const testStartIndex = totalDays - HOLDOUT_DAYS;

      for (let t = testStartIndex; t < totalDays; t++) {
        const actual = series[t] ?? 0;
        const trainHistory = series.slice(0, t);

        // Naive Baseline (predicts yesterday's value)
        const naivePrediction = naive.calculateExpectedDailyDemand(trainHistory);
        recordError("Naive Baseline", HOLDOUT_DAYS, Math.abs(naivePrediction - actual));

        for (const window of WINDOWS) {
          // Moving Average
          const maPrediction = movingAverage.calculateExpectedDailyDemand(
            trainHistory,
            window,
          );
          recordError(
            "Moving Average",
            window,
            Math.abs(maPrediction - actual),
          );

          // Linear Regression
          const lrPrediction = linearRegression.calculateExpectedDailyDemand(
            trainHistory,
            window,
          );
          recordError(
            "Linear Regression",
            window,
            Math.abs(lrPrediction - actual),
          );
        }
      }
    }

    // 3. Compute MAE and percentage improvement over naive baseline
    const naiveErrors = absoluteErrors.get(`Naive Baseline:${HOLDOUT_DAYS}`) ?? [1];
    const naiveMAE =
      naiveErrors.reduce((sum, e) => sum + e, 0) / naiveErrors.length;

    const results: EvaluationResult[] = [];

    // Add baseline
    results.push({
      strategy: "Naive Baseline",
      window: HOLDOUT_DAYS,
      mae: naiveMAE,
      improvementPercentage: 0,
    });

    for (const window of WINDOWS) {
      const maErrors = absoluteErrors.get(`Moving Average:${window}`) ?? [];
      const maMAE =
        maErrors.reduce((sum, e) => sum + e, 0) / (maErrors.length || 1);
      const maImprovement = ((naiveMAE - maMAE) / naiveMAE) * 100;
      results.push({
        strategy: "Moving Average",
        window,
        mae: maMAE,
        improvementPercentage: maImprovement,
      });

      const lrErrors = absoluteErrors.get(`Linear Regression:${window}`) ?? [];
      const lrMAE =
        lrErrors.reduce((sum, e) => sum + e, 0) / (lrErrors.length || 1);
      const lrImprovement = ((naiveMAE - lrMAE) / naiveMAE) * 100;
      results.push({
        strategy: "Linear Regression",
        window,
        mae: lrMAE,
        improvementPercentage: lrImprovement,
      });
    }

    // Sort: Baseline first, then by lowest MAE
    results.sort((a, b) => {
      if (a.strategy === "Naive Baseline") return -1;
      if (b.strategy === "Naive Baseline") return 1;
      return a.mae - b.mae;
    });

    // 4. Output Markdown Table
    console.log("### Demand Forecasting Holdout Evaluation Summary\n");
    console.log(
      "| Strategy | Window (Days) | Mean Absolute Error (MAE) | vs. Naive Baseline |",
    );
    console.log(
      "| :--- | :---: | :---: | :---: |",
    );

    for (const r of results) {
      const impStr =
        r.strategy === "Naive Baseline"
          ? "0.00% (Baseline)"
          : `${r.improvementPercentage >= 0 ? "+" : ""}${r.improvementPercentage.toFixed(2)}%`;
      console.log(
        `| ${r.strategy.padEnd(18)} | ${String(r.window).padStart(6)} | ${r.mae.toFixed(4).padStart(17)} | ${impStr.padStart(16)} |`,
      );
    }

    console.log("\n========================================================");
    console.log("Evaluation complete. Metrics verified against test holdout.");
    console.log("========================================================\n");

    return results;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Execute directly if run via CLI
if (
  process.argv[1]?.endsWith("evaluate.ts") ||
  process.argv[1]?.endsWith("evaluate.js")
) {
  runForecastEvaluation().catch((err) => {
    console.error("Evaluation script encountered error:", err);
    process.exit(1);
  });
}
