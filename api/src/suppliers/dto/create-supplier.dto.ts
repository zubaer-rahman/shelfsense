import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Validates input payload for creating a new supplier partner.
export class CreateSupplierDto {
  @ApiProperty({ example: "Apex Foods & Beverages", description: "Supplier company name" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "+1-555-0101", description: "Supplier phone contact" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: "sales@apexfoods.com", description: "Supplier email address" })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase().trim() : value))
  email?: string;
}
