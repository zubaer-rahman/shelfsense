import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

// Global module providing a single shared PrismaService instance to all modules in the application.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
