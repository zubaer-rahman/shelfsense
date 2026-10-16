import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { MovementType, Role } from "@prisma/client";
import { StockService } from "./stock.service.js";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Exposes HTTP endpoints for recording inventory transactions and querying stock history.
@Controller("stock")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post("movements")
  async recordMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    // Domain rule: SALE movements can be registered by any role; STOCK_IN & ADJUSTMENT require OWNER
    if (
      createStockMovementDto.type !== MovementType.SALE &&
      user.role !== Role.OWNER
    ) {
      throw new ForbiddenException(
        "Only OWNER can record STOCK_IN or ADJUSTMENT movements",
      );
    }

    const result = await this.stockService.recordMovement(
      createStockMovementDto,
      user.id,
    );

    return {
      message: "Stock movement recorded successfully",
      movement: result.movement,
      currentStock: result.newQuantity,
    };
  }
}
