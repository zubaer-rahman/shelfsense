import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AlertsService } from "./alerts.service.js";
import { PaginationDto } from "../common/dto/pagination.dto.js";
import { NearExpiryQueryDto } from "./dto/near-expiry-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";

// Exposes HTTP endpoints for inspecting depleted inventory, upcoming expirations, and expired stock.
@Controller("alerts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get("low-stock")
  async getLowStockAlerts(@Query() query: PaginationDto) {
    const result = await this.alertsService.getLowStockAlerts(query);
    return {
      message: "Low stock alerts retrieved successfully",
      ...result,
    };
  }

  @Get("near-expiry")
  async getNearExpiryAlerts(@Query() query: NearExpiryQueryDto) {
    const result = await this.alertsService.getNearExpiryAlerts(query);
    return {
      message: "Near expiry alerts retrieved successfully",
      ...result,
    };
  }

  @Get("expired")
  async getExpiredAlerts(@Query() query: PaginationDto) {
    const result = await this.alertsService.getExpiredAlerts(query);
    return {
      message: "Expired product alerts retrieved successfully",
      ...result,
    };
  }
}
