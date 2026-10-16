import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

// Validates product creation inputs including SKU normalization, pricing, and supplier reference.
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reorderLevel?: number = 0;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;
}
