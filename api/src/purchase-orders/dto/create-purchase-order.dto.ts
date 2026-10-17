import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// Validates individual line item in a Purchase Order request.
export class CreatePurchaseOrderItemDto {
  @ApiProperty({
    example: "b21a8cd3-4876-4d0c-8ce8-7e44fa734b07",
    description: "UUID of the product to order",
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 25, minimum: 1, description: "Quantity of units to order" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 2.5, description: "Wholesale acquisition cost per unit" })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;
}

// Validates payload for creating a new procurement purchase order draft.
export class CreatePurchaseOrderDto {
  @ApiProperty({
    example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    description: "UUID of the supplying partner",
  })
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;

  @ApiProperty({
    type: [CreatePurchaseOrderItemDto],
    description: "Line items to include on the purchase order",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[];
}
