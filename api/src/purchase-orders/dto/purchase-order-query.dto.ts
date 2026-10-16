import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { POStatus } from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto.js";

// Validates query parameters for filtering and paginating purchase order records.
export class PurchaseOrderQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(POStatus)
  status?: POStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
