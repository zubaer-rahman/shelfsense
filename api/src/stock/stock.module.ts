import { Module } from "@nestjs/common";
import { StockService } from "./stock.service.js";
import { StockController } from "./stock.controller.js";

// Encapsulates stock movement business logic, state transitions, and exports StockService.
@Module({
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
