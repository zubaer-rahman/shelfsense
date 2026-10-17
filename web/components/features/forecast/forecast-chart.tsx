"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ForecastDailyPoint } from "@/hooks/api/use-forecast";
import { format, parseISO } from "date-fns";

interface ForecastChartProps {
  data: ForecastDailyPoint[];
  expectedDemand: number;
  productName: string;
}

export function ForecastChart({
  data,
  expectedDemand,
  productName,
}: ForecastChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((pt) => {
      let label = pt.date;
      try {
        label = format(parseISO(pt.date), "MMM dd");
      } catch {
        // fallback
      }
      return {
        dateStr: pt.date,
        label,
        quantity: pt.quantity,
        projectedAvg: expectedDemand,
      };
    });
  }, [data, expectedDemand]);

  const maxVal = Math.max(...chartData.map((d) => d.quantity), expectedDemand, 10);
  const yDomainMax = Math.ceil(maxVal * 1.25);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Historical Demand & Sales Series
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily retail transactions for <span className="font-semibold text-foreground">{productName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-500" />
            <span className="text-slate-600 dark:text-slate-300">Daily Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">
              Exp. Daily Demand ({expectedDemand.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
          No historical sales recorded for this window.
        </div>
      ) : (
        <div className="w-full h-64 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="label"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                domain={[0, yDomainMax]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-800">
                        <span className="text-slate-400 block font-medium">
                          {d.label} ({d.dateStr})
                        </span>
                        <div className="font-semibold text-teal-300 mt-1 flex items-center gap-2">
                          <span>{d.quantity} units sold</span>
                        </div>
                        <div className="text-[10px] text-amber-300 mt-0.5">
                          Projected rate: {d.projectedAvg.toFixed(2)} units/day
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#0D9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#forecastSalesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
