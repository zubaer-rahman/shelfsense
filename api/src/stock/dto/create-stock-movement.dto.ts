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

// Validates stock movement payloads enforcing positive quantities and type-specific rules.
export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsValidDirectionForType()
  direction?: AdjustmentDirection;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
