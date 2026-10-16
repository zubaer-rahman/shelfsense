import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// Validates input payload for creating a new supplier partner.
export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase().trim() : value))
  email?: string;
}
