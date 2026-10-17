import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

// Query parameters for demand forecasting and reorder calculations.
export class ForecastQueryDto {
  @ApiPropertyOptional({
    enum: ["naive", "moving_average", "linear_regression"],
    default: "moving_average",
    description: "Forecasting strategy algorithm",
  })
  @IsOptional()
  @IsIn(["naive", "moving_average", "linear_regression"])
  strategy?: "naive" | "moving_average" | "linear_regression";

  @ApiPropertyOptional({
    example: 14,
    default: 14,
    minimum: 1,
    maximum: 365,
    description: "Historical days lookback window",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  window?: number;
}
