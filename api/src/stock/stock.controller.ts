import {
  Body,
  Controller,
  ForbiddenException,
  Get,
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
import { MovementType, Role } from "@prisma/client";
import { StockService } from "./stock.service.js";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto.js";
import { StockMovementQueryDto } from "./dto/stock-movement-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Exposes HTTP endpoints for recording inventory transactions and querying stock history.
@ApiTags("Stock Movements")
@ApiBearerAuth("bearer")
@Controller("stock")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({
    summary: "Record an inventory stock movement (SALE: all, STOCK_IN/ADJUSTMENT: OWNER)",
  })
  @ApiResponse({ status: 201, description: "Movement recorded successfully" })
  @ApiResponse({ status: 409, description: "Insufficient stock for requested reduction" })
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

  @ApiOperation({ summary: "Query historical stock movements with filters and pagination" })
  @ApiResponse({ status: 200, description: "Historical stock movements retrieved" })
  @Get("movements")
  async findAll(@Query() query: StockMovementQueryDto) {
    const result = await this.stockService.findAll(query);
    return {
      message: "Stock movements retrieved successfully",
      ...result,
    };
  }
}
