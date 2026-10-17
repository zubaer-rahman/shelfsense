import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AlertsService } from "./alerts.service.js";
import { PaginationDto } from "../common/dto/pagination.dto.js";
import { NearExpiryQueryDto } from "./dto/near-expiry-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";

// Exposes HTTP endpoints for inspecting depleted inventory, upcoming expirations, and expired stock.
@ApiTags("Alerts")
@ApiBearerAuth("bearer")
@Controller("alerts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @ApiOperation({ summary: "List products with low stock (quantity <= reorderLevel)" })
  @ApiResponse({ status: 200, description: "Low stock alerts retrieved" })
  @Get("low-stock")
  async getLowStockAlerts(@Query() query: PaginationDto) {
    const result = await this.alertsService.getLowStockAlerts(query);
    return {
      message: "Low stock alerts retrieved successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "List products expiring within specified horizon (near expiry)" })
  @ApiResponse({ status: 200, description: "Near-expiry alerts retrieved" })
  @Get("near-expiry")
  async getNearExpiryAlerts(@Query() query: NearExpiryQueryDto) {
    const result = await this.alertsService.getNearExpiryAlerts(query);
    return {
      message: "Near expiry alerts retrieved successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "List products that have expired (expiryDate < today)" })
  @ApiResponse({ status: 200, description: "Expired product alerts retrieved" })
  @Get("expired")
  async getExpiredAlerts(@Query() query: PaginationDto) {
    const result = await this.alertsService.getExpiredAlerts(query);
    return {
      message: "Expired product alerts retrieved successfully",
      ...result,
    };
  }
}
