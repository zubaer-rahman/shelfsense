import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto.js";

// Validates query parameters for near-expiry alert filtering.
export class NearExpiryQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
