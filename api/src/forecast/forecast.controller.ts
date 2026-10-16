import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ForecastService } from "./forecast.service.js";
import { ForecastQueryDto } from "./dto/forecast-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";

// Exposes HTTP endpoints for calculating product demand forecasts and safety-stock reorder suggestions.
@Controller("forecast")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get(":productId")
  async getForecast(
    @Param("productId") productId: string,
    @Query() query: ForecastQueryDto,
  ) {
    const forecast = await this.forecastService.getForecast(productId, query);
    return {
      message: "Demand forecast and reorder suggestion calculated successfully",
      ...forecast,
    };
  }
}
