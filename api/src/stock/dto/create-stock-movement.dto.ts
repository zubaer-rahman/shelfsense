import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { MovementType } from "@prisma/client";

export enum AdjustmentDirection {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

// Custom validator ensuring direction is strictly provided for ADJUSTMENT and rejected for other types.
export function IsValidDirectionForType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidDirectionForType",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as { type?: MovementType };
          if (obj.type === MovementType.ADJUSTMENT) {
            return (
              value === AdjustmentDirection.INCREASE ||
              value === AdjustmentDirection.DECREASE
            );
          }
          // For SALE and STOCK_IN, direction must be undefined or null
          return value === undefined || value === null;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as { type?: MovementType };
          if (obj.type === MovementType.ADJUSTMENT) {
            return "direction is required for ADJUSTMENT movements and must be INCREASE or DECREASE";
          }
          return "direction is not allowed for non-ADJUSTMENT movements";
        },
      },
    });
  };
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Validates stock movement payloads enforcing positive quantities and type-specific rules.
export class CreateStockMovementDto {
  @ApiProperty({
    example: "a8a927d7-d069-42c2-b5e0-b3b3a6c38d21",
    description: "UUID of the product",
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    enum: MovementType,
    example: MovementType.SALE,
    description: "Type of stock transaction: SALE (-), STOCK_IN (+), or ADJUSTMENT",
  })
  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  @ApiProperty({
    example: 5,
    minimum: 1,
    description: "Positive integer quantity of units",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    enum: AdjustmentDirection,
    example: AdjustmentDirection.INCREASE,
    description: "Required strictly for ADJUSTMENT (INCREASE or DECREASE). Rejected for SALE or STOCK_IN.",
  })
  @IsValidDirectionForType()
  direction?: AdjustmentDirection;

  @ApiPropertyOptional({
    example: "Customer checkout register #1",
    description: "Audit or reference note",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
