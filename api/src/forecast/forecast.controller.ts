import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { ForecastService } from "./forecast.service.js";
import { ReorderFacade } from "./reorder.facade.js";
import { ForecastQueryDto } from "./dto/forecast-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Exposes HTTP endpoints for calculating product demand forecasts and creating automated reorder drafts.
@ApiTags("Demand Forecasting")
@ApiBearerAuth("bearer")
@Controller("forecast")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForecastController {
  constructor(
    private readonly forecastService: ForecastService,
    private readonly reorderFacade: ReorderFacade,
  ) {}

  @ApiOperation({
    summary: "Calculate expected daily demand and reorder suggestion for a product",
  })
  @ApiResponse({ status: 200, description: "Forecast calculated successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })

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

  @ApiOperation({
    summary: "Generate a draft Purchase Order based on current demand forecast (OWNER only)",
  })
  @ApiResponse({ status: 201, description: "Purchase order draft created" })
  @ApiResponse({ status: 400, description: "Suggested reorder quantity is zero or invalid" })
  @Post([":productId/create-po", ":productId/reorder"])
  @Roles(Role.OWNER)
  async createReorderFromSuggestion(
    @Param("productId") productId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ForecastQueryDto,
  ) {
    const result = await this.reorderFacade.createPOFromSuggestion(
      productId,
      user.id,
      query,
    );
    return {
      message:
        "Purchase order draft created from reorder suggestion successfully",
      ...result,
    };
  }
}
