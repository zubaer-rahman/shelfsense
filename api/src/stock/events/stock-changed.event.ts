import { MovementType } from "@prisma/client";

// Event payload emitted strictly after a stock movement transaction successfully commits.
export class StockChangedEvent {
  constructor(
    public readonly productId: string,
    public readonly newQuantity: number,
    public readonly type: MovementType,
    public readonly timestamp: Date = new Date(),
  ) {}
}
