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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Validates product creation inputs including SKU normalization, pricing, and supplier reference.
export class CreateProductDto {
  @ApiProperty({ example: "Organic Almond Milk 1L", description: "Product name" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: "APX-ALM-01", description: "Unique stock keeping unit code" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  sku!: string;

  @ApiProperty({ example: "Beverages", description: "Product category" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @ApiProperty({ example: 3.99, description: "Unit price in dollars" })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 45, default: 0, description: "Initial on-hand quantity" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number = 0;

  @ApiPropertyOptional({ example: 20, default: 0, description: "Reorder threshold level" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reorderLevel?: number = 0;

  @ApiPropertyOptional({ example: "2026-12-31", description: "Expiration date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: "b21a8cd3-4876-4d0c-8ce8-7e44fa734b07", description: "Supplier UUID" })
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;
}
