import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

// Validates input payload for updating an existing supplier profile.
export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase().trim() : value))
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
