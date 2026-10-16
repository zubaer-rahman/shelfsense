import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service.js";
import { ProductsController } from "./products.controller.js";

// Encapsulates product catalog operations and provides access to products across the system.
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
