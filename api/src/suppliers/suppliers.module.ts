import { Module } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service.js";
import { SuppliersController } from "./suppliers.controller.js";

// Configures and encapsulates supplier domain operations and dependency injection.
@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
