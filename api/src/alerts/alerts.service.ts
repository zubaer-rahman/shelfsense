import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

// Manages real-time inventory alerts, threshold checks, and expiration warnings.
@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  // Verifies whether a product has breached its low-stock reorder threshold.
  isLowStock(quantity: number, reorderLevel: number): boolean {
    return quantity <= reorderLevel;
  }
}
