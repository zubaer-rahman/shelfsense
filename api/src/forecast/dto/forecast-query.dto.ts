import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

// Query parameters for demand forecasting and reorder calculations.
export class ForecastQueryDto {
  @IsOptional()
  @IsIn(["naive", "moving_average", "linear_regression"])
  strategy?: "naive" | "moving_average" | "linear_regression";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  window?: number;
}
