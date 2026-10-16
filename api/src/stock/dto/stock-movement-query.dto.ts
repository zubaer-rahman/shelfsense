import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { MovementType } from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto.js";

// Validates query parameters for filtering and paginating stock movement history.
export class StockMovementQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
